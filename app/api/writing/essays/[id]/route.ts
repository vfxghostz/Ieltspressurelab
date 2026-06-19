import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getBackendStore } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const store = await getBackendStore();
    const essay = store.essays[id];

    if (!essay || essay.userId !== user.id) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 });
    }

    return NextResponse.json({ essay });
  } catch (error) {
    return jsonError(error);
  }
}
