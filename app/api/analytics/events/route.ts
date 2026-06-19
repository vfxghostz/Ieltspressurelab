import { NextResponse } from "next/server";
import type { Database, Json } from "@/integrations/supabase/client";
import { appendLocalUserEvent } from "@/src/server/local-analytics-store";

type UserEventInsert = Database["public"]["Tables"]["user_events"]["Insert"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function insertSupabaseEvent(payload: UserEventInsert): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, error: "Missing Supabase server credentials" };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      return { ok: false, error: await response.text(), status: response.status };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to reach Supabase" };
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;

  if (!isObjectRecord(body) || typeof body.event_name !== "string" || !body.event_name.trim()) {
    return NextResponse.json({ error: "event_name is required" }, { status: 400 });
  }

  const payload: UserEventInsert = {
    event_name: body.event_name.trim(),
    user_id: typeof body.user_id === "string" ? body.user_id : null,
    metadata: isObjectRecord(body.metadata) ? (body.metadata as Json) : {}
  };
  const supabaseResult = await insertSupabaseEvent(payload);

  if (supabaseResult.ok) {
    return NextResponse.json({ ok: true, storage: "supabase" });
  }

  const localEvent = await appendLocalUserEvent({
    user_id: payload.user_id ?? null,
    event_name: payload.event_name,
    metadata: payload.metadata ?? {}
  });

  return NextResponse.json({
    ok: true,
    storage: "local-fallback",
    event: localEvent,
    supabaseError: supabaseResult.error
  });
}
