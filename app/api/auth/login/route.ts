import { NextResponse } from "next/server";
import { jsonError, publicUser, readJson, requireString } from "@/src/server/api-utils";
import { loginUser } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const result = await loginUser({
      email: requireString(body.email, "email"),
      password: requireString(body.password, "password")
    });

    return NextResponse.json({ token: result.token, user: publicUser(result.user) });
  } catch (error) {
    return jsonError(error);
  }
}
