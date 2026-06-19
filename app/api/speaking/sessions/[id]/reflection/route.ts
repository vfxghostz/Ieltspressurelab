import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { saveSpeakingReflection } from "@/src/server/session-store";

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
    const session = await saveSpeakingReflection(user.id, id, {
      feeling: typeof body.felt === "string" ? body.felt : "",
      stuckAt: typeof body.stuck === "string" ? body.stuck : "",
      hardestPart: typeof body.hardest === "string" ? body.hardest : ""
    });

    return NextResponse.json({ session });
  } catch (error) {
    return jsonError(error);
  }
}
