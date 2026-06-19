import { NextResponse } from "next/server";
import { clampNumber, jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { submitListeningSession } from "@/src/server/session-store";

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
    const result = await submitListeningSession(user.id, id, {
      answers: Array.isArray(body.answers) ? (body.answers as { questionId: string; answer: string }[]) : [],
      missedAnswers: clampNumber(body.missedAnswers, "missedAnswers", 0, 100),
      timeSpent: clampNumber(body.timeSpent, "timeSpent", 1, 24 * 60 * 60)
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
