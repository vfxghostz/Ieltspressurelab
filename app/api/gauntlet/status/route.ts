import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getGauntletStatus } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const status = await getGauntletStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    return jsonError(error);
  }
}
