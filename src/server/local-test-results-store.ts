import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Json } from "@/integrations/supabase/client";

export interface TestResultRow {
  id: string;
  user_id: string | null;
  module: string;
  band_score: number;
  accuracy: number;
  metrics: Json;
  created_at: string;
}

const dataDir = process.env.VERCEL ? path.join(os.tmpdir(), "ielts-pressure-lab") : path.join(process.cwd(), ".data");
const resultsPath = path.join(dataDir, "test-results.json");

async function readResults(): Promise<TestResultRow[]> {
  try {
    const raw = await readFile(resultsPath, "utf8");
    return JSON.parse(raw) as TestResultRow[];
  } catch {
    return [];
  }
}

async function writeResults(results: TestResultRow[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(resultsPath, JSON.stringify(results, null, 2), "utf8");
}

export async function appendLocalTestResult(input: Omit<TestResultRow, "id" | "created_at">): Promise<TestResultRow> {
  const results = await readResults();
  const result: TestResultRow = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };

  results.unshift(result);
  await writeResults(results.slice(0, 500));
  return result;
}

export async function getLocalTestResult(id: string) {
  const results = await readResults();
  return results.find((result) => result.id === id) ?? null;
}

export async function listLocalTestResults(limit = 25) {
  const results = await readResults();
  return results
    .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
    .slice(0, limit);
}
