import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { startGauntlet } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const session = await startGauntlet(user.id);
    return NextResponse.json({ sessionId: session.id, sections: session.sections }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
