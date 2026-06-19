import { NextResponse } from "next/server";
import { jsonError } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getBackendStore } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const store = await getBackendStore();
    const essays = Object.values(store.essays)
      .filter((essay) => essay.userId === user.id)
      .map(({ content: _content, ...summary }) => summary);
    return NextResponse.json({ essays });
  } catch (error) {
    return jsonError(error);
  }
}
