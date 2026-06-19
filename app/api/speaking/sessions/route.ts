import { NextResponse } from "next/server";
import { jsonError, parseLevel, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { createSpeakingSession, getBackendStore } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const store = await getBackendStore();
    return NextResponse.json({ sessions: Object.values(store.speakingSessions).filter((session) => session.userId === user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const level = body.level ? parseLevel(body.level) : 1;
    const parts = Array.isArray(body.parts) ? (body.parts as string[]) : undefined;
    const session = await createSpeakingSession(user.id, { level, parts });

    return NextResponse.json(
      {
        sessionId: session.id,
        questions: session.questions,
        session
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
