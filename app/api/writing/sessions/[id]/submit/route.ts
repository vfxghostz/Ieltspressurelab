import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { submitWritingSession } from "@/src/server/session-store";

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
    const result = await submitWritingSession(user.id, id, body);

    return NextResponse.json({
      essayId: result.essay.id,
      wordCount: result.essay.wordCount,
      pace: result.pace,
      onTrack: result.onTrack,
      levelUpAvailable: result.levelUpAvailable,
      session: result.session
    });
  } catch (error) {
    return jsonError(error);
  }
}
