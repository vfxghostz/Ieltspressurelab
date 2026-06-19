import { NextResponse } from "next/server";
import { jsonError, readJson, requireString } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { levelUpUser } from "@/src/server/session-store";
import type { SkillType } from "@/src/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const module = requireString(body.module, "module") as SkillType;
    const result = await levelUpUser(user.id, module);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
