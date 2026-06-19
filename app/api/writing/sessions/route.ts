import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { createWritingSession, getBackendStore } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const store = await getBackendStore();
    return NextResponse.json({ sessions: Object.values(store.writingSessions).filter((session) => session.userId === user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const session = await createWritingSession(user.id, typeof body.topicId === "string" ? body.topicId : undefined);

    return NextResponse.json(
      {
        sessionId: session.id,
        topic: session.topic.topic,
        planningTime: session.planningSeconds,
        writingTime: session.writingSeconds,
        session
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
