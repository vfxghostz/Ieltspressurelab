import { NextResponse } from "next/server";
import { jsonError, parseLevel, readJson, requireString } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { createGenericSession } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const trackId = requireString(body.trackId, "trackId");
    const level = parseLevel(body.level);
    const session = await createGenericSession(user.id, "listening", level, { trackId });
    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
