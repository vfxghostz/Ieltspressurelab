import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { completeGauntletSection } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; sectionId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id, sectionId } = await context.params;
    const body = await readJson(request);
    const result = await completeGauntletSection(user.id, id, sectionId, {
      score: typeof body.score === "number" ? body.score : undefined,
      metrics: typeof body.metrics === "object" && body.metrics ? (body.metrics as Record<string, unknown>) : undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
