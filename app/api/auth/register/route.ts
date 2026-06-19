import { NextResponse } from "next/server";
import { jsonError, optionalString, publicUser, readJson, requireString } from "@/src/server/api-utils";
import { registerUser } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = requireString(body.email, "email");
    const password = requireString(body.password, "password");
    const name = optionalString(body.name);

    if (password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }

    const result = await registerUser({ email, password, name });
    return NextResponse.json({ token: result.token, user: publicUser(result.user) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
