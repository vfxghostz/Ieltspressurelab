import { NextResponse } from "next/server";
import { jsonError, optionalString, publicUser, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { updateUserProfile } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const updated = await updateUserProfile(user.id, {
      name: optionalString(body.name),
      city: optionalString(body.city),
      school: optionalString(body.school),
      grade: optionalString(body.grade)
    });

    return NextResponse.json({ user: publicUser(updated) });
  } catch (error) {
    return jsonError(error);
  }
}
