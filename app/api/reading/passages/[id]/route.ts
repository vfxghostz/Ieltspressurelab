import { NextResponse } from "next/server";
import { getQuery, jsonError, parseLevel } from "@/src/server/api-utils";
import { getReadingPassage } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const level = getQuery(request).get("level") ? parseLevel(getQuery(request).get("level")) : 1;
    const passage = getReadingPassage(id, level);
    return NextResponse.json({ passage });
  } catch (error) {
    return jsonError(error);
  }
}
