import { NextResponse } from "next/server";
import type { Database, Json } from "@/integrations/supabase/client";
import { appendLocalTestResult, getLocalTestResult, listLocalTestResults } from "@/src/server/local-test-results-store";

type TestResultInsert = Database["public"]["Tables"]["test_results"]["Insert"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function insertSupabaseResult(payload: TestResultInsert): Promise<{ ok: true; id: string | null } | { ok: false; error: string; status?: number }> {
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, error: "Missing Supabase server credentials" };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/test_results?select=id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      return { ok: false, error: await response.text(), status: response.status };
    }

    const rows = (await response.json()) as Array<{ id?: string }>;
    return { ok: true, id: rows[0]?.id ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to reach Supabase" };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const result = await getLocalTestResult(id);
    return result
      ? NextResponse.json({ result, storage: "local-fallback" })
      : NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  const limit = Number(url.searchParams.get("limit") ?? 25);
  const results = await listLocalTestResults(Number.isFinite(limit) ? limit : 25);
  return NextResponse.json({ results, storage: "local-fallback" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;

  if (!isObjectRecord(body) || typeof body.module !== "string") {
    return NextResponse.json({ error: "module is required" }, { status: 400 });
  }

  const payload: TestResultInsert = {
    user_id: typeof body.user_id === "string" ? body.user_id : null,
    module: body.module,
    band_score: toNumber(body.band_score),
    accuracy: toNumber(body.accuracy),
    metrics: isObjectRecord(body.metrics) ? (body.metrics as Json) : {}
  };

  const supabaseResult = await insertSupabaseResult(payload);

  if (supabaseResult.ok) {
    return NextResponse.json({
      ok: true,
      storage: "supabase",
      result: {
        ...payload,
        id: supabaseResult.id,
        created_at: new Date().toISOString()
      }
    });
  }

  const localResult = await appendLocalTestResult({
    user_id: payload.user_id ?? null,
    module: payload.module,
    band_score: payload.band_score,
    accuracy: payload.accuracy,
    metrics: payload.metrics ?? {}
  });

  return NextResponse.json({
    ok: true,
    storage: "local-fallback",
    result: localResult,
    supabaseError: supabaseResult.error
  });
}
