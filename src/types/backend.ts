import type { PressureLevel, SkillType } from "@/src/types";

export type ExamModule = SkillType | "gauntlet";
export type ModuleLevel = 1 | 2 | 3;
export type PaceStatus = "ahead" | "on-track" | "behind";
export type WritingSessionState = "planning" | "writing" | "submitted";
export type SpeakingSessionState = "cold-start" | "answering" | "completed";
export type BadgeType = "pace-badge" | "iron-pen" | "cold-blood" | "gauntlet-survivor";

export interface BackendUser {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  city?: string;
  school?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPressureProfile {
  id: string;
  userId: string;
  timerAnxiety: number;
  topicAnxiety: number;
  socialAnxiety: number;
  perfectionism: number;
  weakestArea: SkillType;
  createdAt: string;
}

export interface BackendProgress {
  id: string;
  userId: string;
  readingLevel: ModuleLevel;
  readingSessions: number;
  readingBestAccuracy: number;
  readingBestSpeed: number;
  listeningLevel: ModuleLevel;
  listeningSessions: number;
  listeningTotalMissed: number;
  writingLevel: ModuleLevel;
  writingEssays: number;
  writingNoDeleteUsed: boolean;
  speakingLevel: ModuleLevel;
  speakingColdStartDone: boolean;
  speakingMaxPauseMs: number;
  speakingDilemmaCompleted: boolean;
  gauntletUnlocked: boolean;
  gauntletCompleted: boolean;
  updatedAt: string;
}

export interface GenericSession {
  id: string;
  userId: string;
  module: ExamModule;
  level: ModuleLevel;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  metrics?: Record<string, unknown>;
  score?: number;
  maxScore?: number;
  completed: boolean;
}

export interface BackendBadge {
  id: string;
  userId: string;
  badgeType: BadgeType;
  awardedAt: string;
}

export interface BackendEssay {
  id: string;
  userId: string;
  topic: string;
  content: string;
  wordCount: number;
  erasuresUsed: number;
  duration: number;
  completed: boolean;
  structureComplete: boolean;
  onTrack: boolean;
  createdAt: string;
}

export interface BackendRecording {
  id: string;
  userId: string;
  module: "speaking" | "gauntlet";
  part?: string;
  fileUrl: string;
  duration: number;
  createdAt: string;
}

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  questionType: "multiple_choice" | "true_false" | "matching" | "short_answer";
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  questions: ReadingQuestion[];
}

export interface ListeningQuestion {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  fileUrl: string;
  duration: number;
  accent: "british" | "american" | "australian";
  difficulty: "easy" | "medium" | "hard";
  questions: ListeningQuestion[];
}

export interface WritingTopic {
  id: string;
  topic: string;
  taskType: "task1" | "task2";
  category: "opinion" | "discussion" | "problem_solution" | "advantage_disadvantage";
  difficulty: "easy" | "medium" | "hard";
}

export interface WritingSession {
  id: string;
  userId: string;
  skill: Extract<SkillType, "writing">;
  state: WritingSessionState;
  createdAt: string;
  updatedAt: string;
  topic: WritingTopic;
  planningSeconds: number;
  writingSeconds: number;
  text: string;
  wordCount: number;
  erasuresUsed: number;
  erasuresLimit: number;
  targetWords: number;
  targetWpm: number;
  paceStatus: PaceStatus;
  structure: {
    intro: boolean;
    body: boolean;
    conclusion: boolean;
  };
}

export interface SpeakingQuestion {
  id: string;
  part: "part1" | "part2" | "part3";
  question: string;
  isDilemma: boolean;
  followUps: string[];
}

export interface SpeakingReflection {
  feeling: string;
  stuckAt: string;
  hardestPart: string;
  createdAt: string;
}

export interface SpeakingSession {
  id: string;
  userId: string;
  skill: Extract<SkillType, "speaking">;
  state: SpeakingSessionState;
  level: ModuleLevel;
  createdAt: string;
  updatedAt: string;
  cameraRequired: boolean;
  countdownSeconds: number;
  neutralFace: boolean;
  currentQuestionIndex: number;
  questions: SpeakingQuestion[];
  maxPauseMs: number;
  reflection: SpeakingReflection | null;
}

export interface GauntletSection {
  id: string;
  module: SkillType;
  duration: number;
  level: 3;
  completed: boolean;
  score?: number;
  metrics?: Record<string, unknown>;
}

export interface GauntletSession {
  id: string;
  userId: string;
  startedAt: string;
  completed: boolean;
  sections: GauntletSection[];
}

export interface PressureLabBackendConfig {
  writing: {
    moduleName: "The Forge";
    topicBombSeconds: number;
    planningSeconds: number;
    writingSeconds: number;
    erasuresLimit: number;
    targetWords: number;
    targetWpm: number;
  };
  speaking: {
    moduleName: "The Mirror";
    coldStartSeconds: number;
    silenceThresholdMs: number;
    cameraRequired: boolean;
    neutralFace: boolean;
  };
}

export interface PressureLabStore {
  users: Record<string, BackendUser>;
  profiles: Record<string, BackendPressureProfile>;
  progress: Record<string, BackendProgress>;
  sessions: Record<string, GenericSession>;
  badges: Record<string, BackendBadge>;
  essays: Record<string, BackendEssay>;
  recordings: Record<string, BackendRecording>;
  writingSessions: Record<string, WritingSession>;
  speakingSessions: Record<string, SpeakingSession>;
  gauntletSessions: Record<string, GauntletSession>;
}

export interface LevelUnlockResult {
  unlocked: boolean;
  requirements: string[];
  missing: string[];
}

export interface BadgeDefinition {
  badgeType: BadgeType;
  name: string;
  description: string;
  status: PressureLevel;
}
