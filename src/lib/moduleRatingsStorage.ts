import type { ExamModuleId } from "@/src/data/mockExamData";

export type ModuleProgressStatus = "stable" | "watch" | "critical" | "locked";

export interface ModuleRatingAttempt {
  bandScore: number;
  accuracy: number;
  primary: string;
  secondary: string;
  updatedAt: string;
}

export interface ModuleRating {
  module: ExamModuleId;
  bandScore: number;
  accuracy: number;
  primary: string;
  secondary: string;
  updatedAt: string;
  averageBandScore: number;
  averageAccuracy: number;
  attempts: number;
  progressPercent: number;
  status: ModuleProgressStatus;
  history: ModuleRatingAttempt[];
}

export type ModuleRatingInput = Omit<ModuleRating, "averageBandScore" | "averageAccuracy" | "attempts" | "progressPercent" | "status" | "history">;

export type ModuleRatings = Partial<Record<ExamModuleId, ModuleRating>>;

export const moduleRatingsStorageKey = "ielts-pressure-lab-module-ratings";

function getProgressStatus(progressPercent: number, attempts: number): ModuleProgressStatus {
  if (attempts === 0) {
    return "locked";
  }

  if (progressPercent < 50) {
    return "critical";
  }

  if (progressPercent >= 85) {
    return "stable";
  }

  return "watch";
}

function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

function toAttempt(rating: Partial<ModuleRating> & Pick<ModuleRating, "bandScore" | "accuracy" | "primary" | "secondary" | "updatedAt">): ModuleRatingAttempt {
  return {
    bandScore: rating.bandScore,
    accuracy: rating.accuracy,
    primary: rating.primary,
    secondary: rating.secondary,
    updatedAt: rating.updatedAt
  };
}

export function summarizeModuleRating(module: ExamModuleId, attempts: ModuleRatingAttempt[]): ModuleRating | undefined {
  if (attempts.length === 0) {
    return undefined;
  }

  const latest = attempts[attempts.length - 1];
  const averageBandScore = roundBand(attempts.reduce((sum, attempt) => sum + attempt.bandScore, 0) / attempts.length);
  const averageAccuracy = Math.round(attempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / attempts.length);
  const progressPercent = Math.min(100, Math.round((averageBandScore / 9) * 100));

  return {
    module,
    bandScore: latest.bandScore,
    accuracy: latest.accuracy,
    primary: latest.primary,
    secondary: latest.secondary,
    updatedAt: latest.updatedAt,
    averageBandScore,
    averageAccuracy,
    attempts: attempts.length,
    progressPercent,
    status: getProgressStatus(progressPercent, attempts.length),
    history: attempts
  };
}

function normalizeRating(module: ExamModuleId, rating: ModuleRating): ModuleRating {
  const history = Array.isArray(rating.history) && rating.history.length > 0 ? rating.history : [toAttempt(rating)];
  return summarizeModuleRating(module, history) ?? rating;
}

export function readModuleRatings(): ModuleRatings {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(moduleRatingsStorageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ModuleRatings;
    return Object.fromEntries(
      Object.entries(parsed).map(([module, rating]) => [
        module,
        rating ? normalizeRating(module as ExamModuleId, rating) : rating
      ])
    ) as ModuleRatings;
  } catch {
    return {};
  }
}

export function saveModuleRating(rating: ModuleRatingInput): ModuleRating | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const ratings = readModuleRatings();
  const previousHistory = ratings[rating.module]?.history ?? [];
  const nextRating = summarizeModuleRating(rating.module, [...previousHistory, toAttempt(rating)]);
  const nextRatings: ModuleRatings = {
    ...ratings,
    [rating.module]: nextRating
  };

  window.localStorage.setItem(moduleRatingsStorageKey, JSON.stringify(nextRatings));
  return nextRating;
}
