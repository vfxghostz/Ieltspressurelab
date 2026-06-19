import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getBackendStore, updateSpeakingSession } from "@/src/server/session-store";
import type { SpeakingSessionState } from "@/src/types/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isSpeakingState(value: unknown): value is SpeakingSessionState {
  return value === "cold-start" || value === "answering" || value === "completed";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const store = await getBackendStore();
    const session = store.speakingSessions[id];

    if (!session) {
      return NextResponse.json({ error: "Speaking session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await readJson(request);
    const session = await updateSpeakingSession(user.id, id, {
      currentQuestionIndex: typeof body.currentQuestionIndex === "number" ? body.currentQuestionIndex : undefined,
      maxPauseMs: typeof body.maxPauseMs === "number" ? body.maxPauseMs : undefined,
      state: isSpeakingState(body.state) ? body.state : undefined
    });

    return NextResponse.json({ session });
  } catch (error) {
    return jsonError(error);
  }
}
