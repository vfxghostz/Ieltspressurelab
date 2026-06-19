import { NextResponse } from "next/server";
import { getQuery, jsonError } from "@/src/server/api-utils";
import { filterSpeakingQuestions } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = getQuery(request);
    const isDilemma = query.get("isDilemma") === null ? undefined : query.get("isDilemma") === "true";
    const questions = filterSpeakingQuestions({
      part: query.get("part") ?? undefined,
      isDilemma,
      limit: query.get("limit") ? Number(query.get("limit")) : 10
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return jsonError(error);
  }
}
