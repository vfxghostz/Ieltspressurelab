import { NextResponse } from "next/server";
import { clampNumber, jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { completeSpeakingSession } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await readJson(request);
    const result = await completeSpeakingSession(user.id, id, {
      maxPauseMs: clampNumber(body.maxPauseMs, "maxPauseMs", 0, 60_000),
      postMortem:
        typeof body.postMortem === "object" && body.postMortem
          ? (body.postMortem as { feeling: string; stuckAt: string; hardestPart: string })
          : undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
