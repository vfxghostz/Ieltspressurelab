import { NextResponse } from "next/server";
import { getQuery, jsonError } from "@/src/server/api-utils";
import { filterWritingTopics } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = getQuery(request);
    return NextResponse.json({
      topics: filterWritingTopics({
        taskType: query.get("taskType") ?? undefined,
        category: query.get("category") ?? undefined,
        difficulty: query.get("difficulty") ?? undefined
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}
