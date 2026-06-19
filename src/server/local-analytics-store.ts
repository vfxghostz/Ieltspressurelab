import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Database, Json } from "@/integrations/supabase/client";

export type UserEventRow = Database["public"]["Tables"]["user_events"]["Row"];

const dataDir = process.env.VERCEL ? path.join(os.tmpdir(), "ielts-pressure-lab") : path.join(process.cwd(), ".data");
const eventsPath = path.join(dataDir, "user-events.json");

async function readEvents(): Promise<UserEventRow[]> {
  try {
    const raw = await readFile(eventsPath, "utf8");
    return JSON.parse(raw) as UserEventRow[];
  } catch {
    return [];
  }
}

async function writeEvents(events: UserEventRow[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(eventsPath, JSON.stringify(events, null, 2), "utf8");
}

export async function listLocalUserEvents(limit = 50): Promise<UserEventRow[]> {
  const events = await readEvents();
  return events
    .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
    .slice(0, limit);
}

export async function appendLocalUserEvent(input: {
  user_id: string | null;
  event_name: string;
  metadata: Json | null;
}): Promise<UserEventRow> {
  const events = await readEvents();
  const event: UserEventRow = {
    id: crypto.randomUUID(),
    user_id: input.user_id,
    event_name: input.event_name,
    metadata: input.metadata,
    created_at: new Date().toISOString()
  };

  events.unshift(event);
  await writeEvents(events.slice(0, 500));
  return event;
}
