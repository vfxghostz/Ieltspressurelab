import { NextResponse } from "next/server";
import { clampNumber, jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { getPressureProfile, upsertPressureProfile } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const profile = await getPressureProfile(user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await readJson(request);
    const profile = await upsertPressureProfile(user.id, {
      timerAnxiety: clampNumber(body.timerAnxiety, "timerAnxiety", 1, 10),
      topicAnxiety: clampNumber(body.topicAnxiety, "topicAnxiety", 1, 10),
      socialAnxiety: clampNumber(body.socialAnxiety, "socialAnxiety", 1, 10),
      perfectionism: clampNumber(body.perfectionism, "perfectionism", 1, 10)
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return jsonError(error);
  }
}
