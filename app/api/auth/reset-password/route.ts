import { NextResponse } from "next/server";
import { jsonError, readJson, requireString } from "@/src/server/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    requireString(body.token, "token");
    requireString(body.newPassword, "newPassword");
    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    return jsonError(error);
  }
}
