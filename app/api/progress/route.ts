import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getProgress } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const progress = await getProgress(user.id);
    return NextResponse.json({ progress });
  } catch (error) {
    return jsonError(error);
  }
}
