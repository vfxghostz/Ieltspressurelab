import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getBackendStore, updateWritingSession } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const store = await getBackendStore();
    const session = store.writingSessions[id];

    if (!session) {
      return NextResponse.json({ error: "Writing session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = await readJson(request);
    const result = await updateWritingSession(user.id, id, body);

    return NextResponse.json({
      ...result,
      warning: result.blockedDeletion ? "No more deletions allowed" : null
    });
  } catch (error) {
    return jsonError(error);
  }
}
