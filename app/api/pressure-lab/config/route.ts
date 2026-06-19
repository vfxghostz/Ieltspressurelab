import { NextResponse } from "next/server";
import { backendConfig, speakingQuestions, writingTopics } from "@/src/server/content-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    config: backendConfig,
    writingTopics,
    speakingQuestions
  });
}
