import type { ExamModuleId } from "@/src/data/mockExamData";

export interface ModuleRating {
  module: ExamModuleId;
  bandScore: number;
  accuracy: number;
  primary: string;
  secondary: string;
  updatedAt: string;
}

export type ModuleRatings = Partial<Record<ExamModuleId, ModuleRating>>;

export const moduleRatingsStorageKey = "ielts-pressure-lab-module-ratings";

export function readModuleRatings(): ModuleRatings {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(moduleRatingsStorageKey);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ModuleRatings;
  } catch {
    return {};
  }
}

export function saveModuleRating(rating: ModuleRating) {
  if (typeof window === "undefined") {
    return;
  }

  const ratings = readModuleRatings();
  const nextRatings: ModuleRatings = {
    ...ratings,
    [rating.module]: rating
  };

  window.localStorage.setItem(moduleRatingsStorageKey, JSON.stringify(nextRatings));
}
