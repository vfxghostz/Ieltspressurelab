import { NextResponse } from "next/server";
import type { Database } from "@/integrations/supabase/client";
import { listLocalUserEvents } from "@/src/server/local-analytics-store";

type UserEventRow = Database["public"]["Tables"]["user_events"]["Row"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

export async function GET(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: "Missing Supabase server credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
  const query = new URLSearchParams({
    select: "id,user_id,event_name,metadata,created_at",
    order: "created_at.desc",
    limit: String(limit)
  });

  let response: Response;

  try {
    response = await fetch(`${supabaseUrl}/rest/v1/user_events?${query.toString()}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      cache: "no-store"
    });
  } catch (error) {
    return NextResponse.json(
      {
        events: await listLocalUserEvents(limit),
        storage: "local-fallback",
        supabaseError: error instanceof Error ? error.message : "Unable to reach Supabase from the local server."
      },
      { status: 200 }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    const isMissingUserEventsTable = response.status === 404 && errorText.includes("user_events");

    if (isMissingUserEventsTable) {
      return NextResponse.json({
        events: await listLocalUserEvents(limit),
        storage: "local-fallback",
        supabaseError: errorText
      });
    }

    return NextResponse.json(
      {
        error: errorText || response.statusText
      },
      { status: response.status }
    );
  }

  const events = (await response.json()) as UserEventRow[];
  return NextResponse.json({ events });
}
