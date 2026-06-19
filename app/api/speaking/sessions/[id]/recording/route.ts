import { NextResponse } from "next/server";
import { clampNumber, jsonError, readJson } from "@/src/server/api-utils";
import { requireUser } from "@/src/server/request-auth";
import { saveSpeakingRecording } from "@/src/server/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    let input: { fileUrl?: string; part?: string; duration: number };

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      input = {
        fileUrl: typeof form.get("fileUrl") === "string" ? String(form.get("fileUrl")) : undefined,
        part: typeof form.get("part") === "string" ? String(form.get("part")) : undefined,
        duration: clampNumber(form.get("duration"), "duration", 1, 60 * 60)
      };
    } else {
      const body = await readJson(request);
      input = {
        fileUrl: typeof body.fileUrl === "string" ? body.fileUrl : undefined,
        part: typeof body.part === "string" ? body.part : undefined,
        duration: clampNumber(body.duration, "duration", 1, 60 * 60)
      };
    }

    const recording = await saveSpeakingRecording(user.id, id, input);
    return NextResponse.json({ recordingId: recording.id, fileUrl: recording.fileUrl });
  } catch (error) {
    return jsonError(error);
  }
}
