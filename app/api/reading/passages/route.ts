import { NextResponse } from "next/server";
import { getQuery, jsonError, parseLevel } from "@/src/server/api-utils";
import { filterReadingPassages } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = getQuery(request);
    const level = query.get("level") ? parseLevel(query.get("level")) : undefined;
    const difficulty = query.get("difficulty") ?? undefined;
    const limit = query.get("limit") ? Number(query.get("limit")) : 10;
    const passages = filterReadingPassages({ level, difficulty, limit }).map(({ content: _content, questions: _questions, ...summary }) => summary);
    return NextResponse.json({ passages });
  } catch (error) {
    return jsonError(error);
  }
}
