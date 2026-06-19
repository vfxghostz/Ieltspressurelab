import { NextResponse } from "next/server";
import { jsonError, publicUser } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    return jsonError(error);
  }
}
