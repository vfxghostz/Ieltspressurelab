import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { getAudioTrack } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const track = getAudioTrack(id);
    return NextResponse.json({ track });
  } catch (error) {
    return jsonError(error);
  }
}
