import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { completeGauntlet } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const result = await completeGauntlet(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
