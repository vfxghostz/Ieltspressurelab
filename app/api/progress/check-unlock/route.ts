import { NextResponse } from "next/server";
import { jsonError, parseLevel, readJson, requireString } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { checkUnlockForUser } from "@/src/server/session-store";
import type { ExamModule } from "@/src/types/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const module = requireString(body.module, "module") as ExamModule;
    const level = parseLevel(body.level);
    const result = await checkUnlockForUser(user.id, module, level);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
