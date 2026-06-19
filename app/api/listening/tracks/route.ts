import { NextResponse } from "next/server";
import { getQuery, jsonError } from "@/src/server/api-utils";
import { filterAudioTracks } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = getQuery(request);
    const tracks = filterAudioTracks({
      accent: query.get("accent") ?? undefined,
      limit: query.get("limit") ? Number(query.get("limit")) : 10
    }).map(({ questions: _questions, fileUrl: _fileUrl, ...summary }) => summary);
    return NextResponse.json({ tracks });
  } catch (error) {
    return jsonError(error);
  }
}
