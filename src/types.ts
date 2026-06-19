import type { LucideIcon } from "lucide-react";

export type SkillType = "reading" | "listening" | "writing" | "speaking";

export type PressureLevel = "stable" | "watch" | "critical" | "locked";

export type VariantId = "cockpit" | "map" | "command";

export type DesignThemeId = "clinical" | "graphite" | "bilingual";

export type Locale = "en" | "ru";

export interface PressureProfile {
  timerAnxiety: number;
  topicAnxiety: number;
  socialAnxiety: number;
  perfectionism: number;
  weakestArea: SkillType;
}

export interface SkillProgress {
  skill: SkillType;
  label: string;
  level: 1 | 2 | 3;
  sessionsCompleted: number;
  targetSessions: number;
  status: PressureLevel;
  metric: string;
  delta: string;
  nextUnlock: string;
  icon: LucideIcon;
}

export interface TrainingSession {
  id: string;
  skill: SkillType;
  title: string;
  mode: string;
  level: 1 | 2 | 3;
  duration: string;
  pressureRule: string;
  primaryMetric: string;
  secondaryMetric: string;
  status: PressureLevel;
}

export interface DrillQuestion {
  id: string;
  prompt: string;
  answerState: "unanswered" | "answered" | "missed";
}

export interface VariantOption {
  id: VariantId;
  label: string;
  description: string;
}

export interface DesignTheme {
  id: DesignThemeId;
  label: string;
  shortLabel: string;
  shortCode: string;
  symbol: string;
  ariaLabel: string;
  colorPair: string;
  description: string;
}
