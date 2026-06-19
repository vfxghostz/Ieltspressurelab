import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/src/server/api-utils";
import { createToken, hashPassword, verifyPassword } from "@/src/server/auth";
import { audioTracks, backendConfig, badgeDefinitions, readingPassages, speakingQuestions, writingTopics } from "@/src/server/content-bank";
import type {
  AudioTrack,
  BackendBadge,
  BackendEssay,
  BackendPressureProfile,
  BackendProgress,
  BackendRecording,
  BackendUser,
  BadgeType,
  ExamModule,
  GauntletSession,
  GenericSession,
  LevelUnlockResult,
  ModuleLevel,
  PaceStatus,
  PressureLabStore,
  ReadingPassage,
  SpeakingReflection,
  SpeakingSession,
  WritingSession
} from "@/src/types/backend";
import type { SkillType } from "@/src/types";

const storeDirectory = path.join(process.cwd(), ".data");
const storePath = path.join(storeDirectory, "pressure-lab-store.json");

const initialStore: PressureLabStore = {
  users: {},
  profiles: {},
  progress: {},
  sessions: {},
  badges: {},
  essays: {},
  recordings: {},
  writingSessions: {},
  speakingSessions: {},
  gauntletSessions: {}
};

async function readStore(): Promise<PressureLabStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    return {
      ...initialStore,
      ...(JSON.parse(raw) as Partial<PressureLabStore>)
    };
  } catch {
    return structuredClone(initialStore);
  }
}

async function writeStore(store: PressureLabStore) {
  await mkdir(storeDirectory, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function countWords(text: string) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function hasEssayStructure(text: string) {
  const lower = text.toLowerCase();
  return {
    intro: /\b(introduction|introduce|opinion|essay)\b/.test(lower) || text.length > 50,
    body: /\b(first|second|because|however|moreover|for example)\b/.test(lower) || countWords(text) >= 120,
    conclusion: /\b(conclusion|conclude|overall|in summary|to sum up)\b/.test(lower)
  };
}

function structureComplete(structure: { intro: boolean; body: boolean; conclusion: boolean }) {
  return structure.intro && structure.body && structure.conclusion;
}

function getPace(wordCount: number, durationSeconds: number) {
  return wordCount / Math.max(durationSeconds / 60, 1 / 60);
}

function getPaceStatus(wordCount: number, createdAt: string): PaceStatus {
  const elapsedMinutes = Math.max((Date.now() - new Date(createdAt).getTime()) / 60000, 0.1);
  const pace = wordCount / elapsedMinutes;

  if (pace >= backendConfig.writing.targetWpm + 1) {
    return "ahead";
  }

  if (pace >= backendConfig.writing.targetWpm) {
    return "on-track";
  }

  return "behind";
}

function getDefaultProgress(userId: string): BackendProgress {
  return {
    id: crypto.randomUUID(),
    userId,
    readingLevel: 1,
    readingSessions: 0,
    readingBestAccuracy: 0,
    readingBestSpeed: 0,
    listeningLevel: 1,
    listeningSessions: 0,
    listeningTotalMissed: 0,
    writingLevel: 1,
    writingEssays: 0,
    writingNoDeleteUsed: false,
    speakingLevel: 1,
    speakingColdStartDone: false,
    speakingMaxPauseMs: 0,
    speakingDilemmaCompleted: false,
    gauntletUnlocked: false,
    gauntletCompleted: false,
    updatedAt: now()
  };
}

function ensureProgress(store: PressureLabStore, userId: string) {
  let progress = Object.values(store.progress).find((item) => item.userId === userId);

  if (!progress) {
    progress = getDefaultProgress(userId);
    store.progress[progress.id] = progress;
  }

  return progress;
}

function awardBadge(store: PressureLabStore, userId: string, badgeType: BadgeType) {
  const exists = Object.values(store.badges).some((badge) => badge.userId === userId && badge.badgeType === badgeType);

  if (exists) {
    return null;
  }

  const badge: BackendBadge = {
    id: crypto.randomUUID(),
    userId,
    badgeType,
    awardedAt: now()
  };

  store.badges[badge.id] = badge;
  return badge;
}

function checkBadgesInternal(store: PressureLabStore, userId: string) {
  const progress = ensureProgress(store, userId);
  const userSessions = Object.values(store.sessions).filter((session) => session.userId === userId);
  const userEssays = Object.values(store.essays).filter((essay) => essay.userId === userId);
  const newlyAwarded: BackendBadge[] = [];

  const recentListening = userSessions.filter((session) => session.module === "listening" && session.level >= 2).slice(-5);
  if (recentListening.length >= 5 && recentListening.every((session) => session.metrics?.missedAnswers === 0)) {
    const badge = awardBadge(store, userId, "pace-badge");
    if (badge) newlyAwarded.push(badge);
  }

  if (userEssays.filter((essay) => essay.erasuresUsed <= 5 && essay.completed).length >= 3) {
    const badge = awardBadge(store, userId, "iron-pen");
    if (badge) newlyAwarded.push(badge);
  }

  if (progress.speakingColdStartDone && progress.speakingMaxPauseMs <= 3000) {
    const badge = awardBadge(store, userId, "cold-blood");
    if (badge) newlyAwarded.push(badge);
  }

  if (progress.gauntletCompleted) {
    const badge = awardBadge(store, userId, "gauntlet-survivor");
    if (badge) newlyAwarded.push(badge);
  }

  return newlyAwarded;
}

function calculateWeakestArea(profile: Omit<BackendPressureProfile, "weakestArea" | "id" | "userId" | "createdAt">): SkillType {
  const scores: Record<SkillType, number> = {
    reading: profile.timerAnxiety + profile.perfectionism,
    listening: profile.timerAnxiety + profile.perfectionism,
    writing: profile.topicAnxiety + profile.perfectionism,
    speaking: profile.socialAnxiety + profile.topicAnxiety
  };

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as SkillType;
}

function getRequirements(module: ExamModule, targetLevel: ModuleLevel) {
  if (targetLevel === 1) return [];

  const map: Record<string, string[]> = {
    "reading-2": ["Complete 3 Reading sessions", "Achieve 70% accuracy", "Reach 180 wpm"],
    "reading-3": ["Complete 5 Reading sessions", "Achieve 75% accuracy", "Reach 200 wpm"],
    "listening-2": ["Complete 3 Listening sessions", "Keep missed answers at 2 or fewer"],
    "listening-3": ["Complete 5 Listening sessions", "Keep missed answers at 1 or fewer"],
    "writing-2": ["Complete 3 structured essays", "Use No-Delete mode"],
    "writing-3": ["Complete 5 essays", "Stay within 10% of target pace"],
    "speaking-2": ["Complete Cold Start", "Keep first-answer pause under 3 seconds"],
    "speaking-3": ["Complete Cold Start", "Keep pause under 2 seconds", "Complete dilemma question"]
  };

  return map[`${module}-${targetLevel}`] ?? [];
}

export function checkLevelUnlock(module: ExamModule, targetLevel: ModuleLevel, progress: BackendProgress): LevelUnlockResult {
  const requirements = getRequirements(module, targetLevel);
  const missing: string[] = [];

  if (targetLevel === 1) {
    return { unlocked: true, requirements, missing };
  }

  if (module === "reading") {
    if (progress.readingSessions < (targetLevel === 2 ? 3 : 5)) missing.push(requirements[0]);
    if (progress.readingBestAccuracy < (targetLevel === 2 ? 0.7 : 0.75)) missing.push(requirements[1]);
    if (progress.readingBestSpeed < (targetLevel === 2 ? 180 : 200)) missing.push(requirements[2]);
  }

  if (module === "listening") {
    if (progress.listeningSessions < (targetLevel === 2 ? 3 : 5)) missing.push(requirements[0]);
    const allowedMissed = targetLevel === 2 ? 2 : 1;
    const averageMissed = progress.listeningSessions > 0 ? progress.listeningTotalMissed / progress.listeningSessions : Number.POSITIVE_INFINITY;
    if (averageMissed > allowedMissed) missing.push(requirements[1]);
  }

  if (module === "writing") {
    if (progress.writingEssays < (targetLevel === 2 ? 3 : 5)) missing.push(requirements[0]);
    if (!progress.writingNoDeleteUsed) missing.push(requirements[1]);
  }

  if (module === "speaking") {
    if (!progress.speakingColdStartDone) missing.push(requirements[0]);
    if (progress.speakingMaxPauseMs > (targetLevel === 2 ? 3000 : 2000) || progress.speakingMaxPauseMs === 0) missing.push(requirements[1]);
    if (targetLevel === 3 && !progress.speakingDilemmaCompleted) missing.push(requirements[2]);
  }

  return { unlocked: missing.length === 0, requirements, missing };
}

function chooseWritingTopic(topicId?: string) {
  return writingTopics.find((topic) => topic.id === topicId) ?? writingTopics[0];
}

export async function getBackendStore() {
  return readStore();
}

export async function registerUser(input: { email: string; password: string; name?: string }) {
  const store = await readStore();
  const existing = Object.values(store.users).find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new ApiError("Email already registered", 409);

  const timestamp = now();
  const user: BackendUser = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    passwordHash: hashPassword(input.password),
    name: input.name,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  store.users[user.id] = user;
  const progress = getDefaultProgress(user.id);
  store.progress[progress.id] = progress;
  await writeStore(store);
  return { token: createToken(user.id), user };
}

export async function loginUser(input: { email: string; password: string }) {
  const store = await readStore();
  const user = Object.values(store.users).find((item) => item.email.toLowerCase() === input.email.toLowerCase());
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new ApiError("Invalid email or password", 401);
  }

  return { token: createToken(user.id), user };
}

export async function updateUserProfile(userId: string, input: Partial<Pick<BackendUser, "name" | "city" | "school" | "grade">>) {
  const store = await readStore();
  const user = store.users[userId];
  if (!user) throw new ApiError("User not found", 404);

  const updated = {
    ...user,
    ...input,
    updatedAt: now()
  };

  store.users[userId] = updated;
  await writeStore(store);
  return updated;
}

export async function upsertPressureProfile(
  userId: string,
  input: {
    timerAnxiety: number;
    topicAnxiety: number;
    socialAnxiety: number;
    perfectionism: number;
  }
) {
  const store = await readStore();
  const existing = Object.values(store.profiles).find((profile) => profile.userId === userId);
  const profile: BackendPressureProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    userId,
    ...input,
    weakestArea: calculateWeakestArea(input),
    createdAt: existing?.createdAt ?? now()
  };

  store.profiles[profile.id] = profile;
  await writeStore(store);
  return profile;
}

export async function getPressureProfile(userId: string) {
  const store = await readStore();
  return Object.values(store.profiles).find((profile) => profile.userId === userId) ?? null;
}

export async function getProfileRecommendations(userId: string) {
  const profile = await getPressureProfile(userId);
  if (!profile) throw new ApiError("Pressure profile not found", 404);

  const focusAreas: Record<SkillType, string[]> = {
    reading: ["Sprint & Lock Level 1", "Focus Mode", "Pace Bar training"],
    listening: ["One Shot Level 1", "Missed It practice", "Speed Dial"],
    writing: ["Topic Bomb drills", "No-Delete mode", "Pace Tracker"],
    speaking: ["Cold Start exposure", "Neutral Face desensitization", "Dilemma Questions"]
  };

  return {
    weakestArea: profile.weakestArea,
    recommendedModule: profile.weakestArea,
    recommendedLevel: 1,
    focusAreas: focusAreas[profile.weakestArea]
  };
}

export async function getProgress(userId: string) {
  const store = await readStore();
  const progress = ensureProgress(store, userId);
  await writeStore(store);
  return progress;
}

export async function checkUnlockForUser(userId: string, module: ExamModule, level: ModuleLevel) {
  const progress = await getProgress(userId);
  return checkLevelUnlock(module, level, progress);
}

export async function levelUpUser(userId: string, module: SkillType) {
  const store = await readStore();
  const progress = ensureProgress(store, userId);
  const currentLevel = progress[`${module}Level` as keyof BackendProgress] as ModuleLevel;
  const nextLevel = Math.min(currentLevel + 1, 3) as ModuleLevel;
  const result = checkLevelUnlock(module, nextLevel, progress);
  if (!result.unlocked) return { success: false, newLevel: currentLevel, missing: result.missing };

  (progress as unknown as Record<string, ModuleLevel>)[`${module}Level`] = nextLevel;
  progress.updatedAt = now();
  checkBadgesInternal(store, userId);
  await writeStore(store);
  return { success: true, newLevel: nextLevel, missing: [] };
}

export function filterReadingPassages(input: { level?: ModuleLevel; difficulty?: string; limit?: number }): ReadingPassage[] {
  const limit = input.limit ?? 10;
  return readingPassages.filter((passage) => !input.difficulty || passage.difficulty === input.difficulty).slice(0, limit);
}

export function getReadingPassage(id: string, level: ModuleLevel = 1) {
  const passage = readingPassages.find((item) => item.id === id);
  if (!passage) throw new ApiError("Passage not found", 404);

  if (level >= 2) {
    const { content: _content, ...safePassage } = passage;
    return safePassage;
  }

  return passage;
}

export async function createGenericSession(userId: string, module: ExamModule, level: ModuleLevel, metrics: Record<string, unknown> = {}) {
  const store = await readStore();
  const session: GenericSession = {
    id: crypto.randomUUID(),
    userId,
    module,
    level,
    startedAt: now(),
    metrics,
    completed: false
  };

  store.sessions[session.id] = session;
  await writeStore(store);
  return session;
}

export async function submitReadingSession(
  userId: string,
  id: string,
  input: { answers: { questionId: string; answer: string }[]; timeSpent: number; wordsRead: number }
) {
  const store = await readStore();
  const session = store.sessions[id];
  if (!session || session.userId !== userId || session.module !== "reading") throw new ApiError("Reading session not found", 404);
  const passageId = String(session.metrics?.passageId ?? "");
  const passage = readingPassages.find((item) => item.id === passageId);
  if (!passage) throw new ApiError("Passage not found", 404);

  const score = passage.questions.filter((question) => input.answers.some((answer) => answer.questionId === question.id && answer.answer === question.correctAnswer)).length;
  const maxScore = passage.questions.length;
  const accuracy = maxScore > 0 ? score / maxScore : 0;
  const speed = Math.round(input.wordsRead / Math.max(input.timeSpent / 60, 1 / 60));
  const progress = ensureProgress(store, userId);
  progress.readingSessions += 1;
  progress.readingBestAccuracy = Math.max(progress.readingBestAccuracy, accuracy);
  progress.readingBestSpeed = Math.max(progress.readingBestSpeed, speed);
  progress.updatedAt = now();

  session.endedAt = now();
  session.duration = input.timeSpent;
  session.completed = true;
  session.score = score;
  session.maxScore = maxScore;
  session.metrics = { ...session.metrics, accuracy, speed };

  const levelUpAvailable = checkLevelUnlock("reading", Math.min(session.level + 1, 3) as ModuleLevel, progress).unlocked;
  await writeStore(store);
  return { score, maxScore, accuracy, speed, levelUpAvailable };
}

export function filterAudioTracks(input: { accent?: string; limit?: number }): AudioTrack[] {
  const limit = input.limit ?? 10;
  return audioTracks.filter((track) => !input.accent || track.accent === input.accent).slice(0, limit);
}

export function getAudioTrack(id: string) {
  const track = audioTracks.find((item) => item.id === id);
  if (!track) throw new ApiError("Audio track not found", 404);
  return track;
}

export async function submitListeningSession(
  userId: string,
  id: string,
  input: { answers: { questionId: string; answer: string }[]; missedAnswers: number; timeSpent: number }
) {
  const store = await readStore();
  const session = store.sessions[id];
  if (!session || session.userId !== userId || session.module !== "listening") throw new ApiError("Listening session not found", 404);
  const trackId = String(session.metrics?.trackId ?? "");
  const track = audioTracks.find((item) => item.id === trackId);
  if (!track) throw new ApiError("Audio track not found", 404);

  const score = track.questions.filter((question) => input.answers.some((answer) => answer.questionId === question.id && answer.answer === question.correctAnswer)).length;
  const maxScore = track.questions.length;
  const progress = ensureProgress(store, userId);
  progress.listeningSessions += 1;
  progress.listeningTotalMissed += input.missedAnswers;
  progress.updatedAt = now();

  session.endedAt = now();
  session.duration = input.timeSpent;
  session.completed = true;
  session.score = score;
  session.maxScore = maxScore;
  session.metrics = { ...session.metrics, missedAnswers: input.missedAnswers };

  const levelUpAvailable = checkLevelUnlock("listening", Math.min(session.level + 1, 3) as ModuleLevel, progress).unlocked;
  await writeStore(store);
  return { score, maxScore, missedCount: input.missedAnswers, levelUpAvailable };
}

export function filterWritingTopics(input: { taskType?: string; category?: string; difficulty?: string }) {
  return writingTopics.filter(
    (topic) =>
      (!input.taskType || topic.taskType === input.taskType) &&
      (!input.category || topic.category === input.category) &&
      (!input.difficulty || topic.difficulty === input.difficulty)
  );
}

export async function createWritingSession(userId: string, topicId?: string) {
  const store = await readStore();
  const timestamp = now();
  const session: WritingSession = {
    id: crypto.randomUUID(),
    userId,
    skill: "writing",
    state: "planning",
    createdAt: timestamp,
    updatedAt: timestamp,
    topic: chooseWritingTopic(topicId),
    planningSeconds: backendConfig.writing.planningSeconds,
    writingSeconds: backendConfig.writing.writingSeconds,
    text: "",
    wordCount: 0,
    erasuresUsed: 0,
    erasuresLimit: backendConfig.writing.erasuresLimit,
    targetWords: backendConfig.writing.targetWords,
    targetWpm: backendConfig.writing.targetWpm,
    paceStatus: "behind",
    structure: { intro: false, body: false, conclusion: false }
  };

  store.writingSessions[session.id] = session;
  await writeStore(store);
  return session;
}

export async function updateWritingSession(userId: string, id: string, input: { text?: string; structure?: Partial<WritingSession["structure"]> }) {
  const store = await readStore();
  const session = store.writingSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Writing session not found", 404);
  const nextSession: WritingSession = { ...session, state: session.state === "submitted" ? "submitted" : "writing", updatedAt: now() };
  let blockedDeletion = false;

  if (typeof input.text === "string") {
    const isDeletion = input.text.length < session.text.length;
    if (isDeletion && session.erasuresUsed >= session.erasuresLimit) {
      blockedDeletion = true;
    } else {
      nextSession.text = input.text;
      nextSession.wordCount = countWords(input.text);
      nextSession.paceStatus = getPaceStatus(nextSession.wordCount, nextSession.createdAt);
      nextSession.structure = { ...nextSession.structure, ...hasEssayStructure(input.text) };
      if (isDeletion) nextSession.erasuresUsed += 1;
    }
  }

  if (input.structure) nextSession.structure = { ...nextSession.structure, ...input.structure };

  store.writingSessions[id] = nextSession;
  await writeStore(store);
  return { session: nextSession, blockedDeletion };
}

export async function submitWritingSession(
  userId: string,
  id: string,
  input: { content?: string; wordCount?: number; erasuresUsed?: number; duration?: number; structure?: Partial<WritingSession["structure"]> }
) {
  const store = await readStore();
  const session = store.writingSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Writing session not found", 404);
  const content = input.content ?? session.text;
  const wordCount = input.wordCount ?? countWords(content);
  const duration = input.duration ?? Math.max(Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000), 1);
  const pace = getPace(wordCount, duration);
  const structure = { ...session.structure, ...hasEssayStructure(content), ...input.structure };
  const onTrack = pace >= backendConfig.writing.targetWpm * 0.9;

  const essay: BackendEssay = {
    id: crypto.randomUUID(),
    userId,
    topic: session.topic.topic,
    content,
    wordCount,
    erasuresUsed: input.erasuresUsed ?? session.erasuresUsed,
    duration,
    completed: true,
    structureComplete: structureComplete(structure),
    onTrack,
    createdAt: now()
  };

  session.state = "submitted";
  session.text = content;
  session.wordCount = wordCount;
  session.structure = structure;
  session.updatedAt = now();
  store.essays[essay.id] = essay;

  const progress = ensureProgress(store, userId);
  progress.writingEssays += 1;
  progress.writingNoDeleteUsed = true;
  progress.updatedAt = now();

  const levelUpAvailable = checkLevelUnlock("writing", Math.min(progress.writingLevel + 1, 3) as ModuleLevel, progress).unlocked;
  checkBadgesInternal(store, userId);
  await writeStore(store);
  return { essay, pace, onTrack, levelUpAvailable, session };
}

export function filterSpeakingQuestions(input: { part?: string; isDilemma?: boolean; limit?: number }) {
  const limit = input.limit ?? 10;
  return speakingQuestions
    .filter((question) => (!input.part || question.part === input.part) && (typeof input.isDilemma !== "boolean" || question.isDilemma === input.isDilemma))
    .slice(0, limit);
}

export async function createSpeakingSession(userId: string, input: { level?: ModuleLevel; parts?: string[] } = {}) {
  const store = await readStore();
  const selectedQuestions = speakingQuestions.filter((question) => !input.parts?.length || input.parts.includes(question.part));
  const timestamp = now();
  const session: SpeakingSession = {
    id: crypto.randomUUID(),
    userId,
    skill: "speaking",
    state: "cold-start",
    level: input.level ?? 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    cameraRequired: backendConfig.speaking.cameraRequired,
    countdownSeconds: backendConfig.speaking.coldStartSeconds,
    neutralFace: backendConfig.speaking.neutralFace,
    currentQuestionIndex: 0,
    questions: selectedQuestions.length > 0 ? selectedQuestions : speakingQuestions,
    maxPauseMs: 0,
    reflection: null
  };

  store.speakingSessions[session.id] = session;
  await writeStore(store);
  return session;
}

export async function updateSpeakingSession(
  userId: string,
  id: string,
  input: { currentQuestionIndex?: number; maxPauseMs?: number; state?: SpeakingSession["state"] }
) {
  const store = await readStore();
  const session = store.speakingSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Speaking session not found", 404);

  const nextSession: SpeakingSession = {
    ...session,
    currentQuestionIndex:
      typeof input.currentQuestionIndex === "number"
        ? Math.min(Math.max(input.currentQuestionIndex, 0), session.questions.length - 1)
        : session.currentQuestionIndex,
    maxPauseMs: typeof input.maxPauseMs === "number" ? Math.max(input.maxPauseMs, session.maxPauseMs) : session.maxPauseMs,
    state: input.state ?? session.state,
    updatedAt: now()
  };

  store.speakingSessions[id] = nextSession;
  await writeStore(store);
  return nextSession;
}

export async function saveSpeakingRecording(userId: string, id: string, input: { fileUrl?: string; part?: string; duration: number }) {
  const store = await readStore();
  const session = store.speakingSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Speaking session not found", 404);

  const recording: BackendRecording = {
    id: crypto.randomUUID(),
    userId,
    module: "speaking",
    part: input.part,
    fileUrl: input.fileUrl ?? `/recordings/local/${id}.webm`,
    duration: input.duration,
    createdAt: now()
  };

  store.recordings[recording.id] = recording;
  await writeStore(store);
  return recording;
}

export async function completeSpeakingSession(userId: string, id: string, input: { maxPauseMs: number; postMortem?: Omit<SpeakingReflection, "createdAt"> }) {
  const store = await readStore();
  const session = store.speakingSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Speaking session not found", 404);

  const completed: SpeakingSession = {
    ...session,
    state: "completed",
    maxPauseMs: Math.max(session.maxPauseMs, input.maxPauseMs),
    reflection: input.postMortem ? { ...input.postMortem, createdAt: now() } : session.reflection,
    updatedAt: now()
  };
  store.speakingSessions[id] = completed;

  const progress = ensureProgress(store, userId);
  progress.speakingColdStartDone = true;
  progress.speakingMaxPauseMs = progress.speakingMaxPauseMs === 0 ? completed.maxPauseMs : Math.min(progress.speakingMaxPauseMs, completed.maxPauseMs);
  progress.speakingDilemmaCompleted = session.questions.some((question) => question.isDilemma);
  progress.updatedAt = now();

  const levelUpAvailable = checkLevelUnlock("speaking", Math.min(progress.speakingLevel + 1, 3) as ModuleLevel, progress).unlocked;
  checkBadgesInternal(store, userId);
  await writeStore(store);
  return { completed: true, levelUpAvailable, session: completed };
}

export async function saveSpeakingReflection(userId: string, id: string, reflection: Omit<SpeakingReflection, "createdAt">) {
  const result = await completeSpeakingSession(userId, id, { maxPauseMs: 3000, postMortem: reflection });
  return result.session;
}

export async function getBadges(userId: string) {
  const store = await readStore();
  return Object.values(store.badges).filter((badge) => badge.userId === userId);
}

export async function checkBadges(userId: string) {
  const store = await readStore();
  const newlyAwarded = checkBadgesInternal(store, userId);
  await writeStore(store);
  return newlyAwarded.map((badge) => ({
    ...badge,
    ...badgeDefinitions.find((definition) => definition.badgeType === badge.badgeType)
  }));
}

export async function getGauntletStatus(userId: string) {
  const progress = await getProgress(userId);
  const unlocked = progress.readingLevel === 3 && progress.listeningLevel === 3 && progress.writingLevel === 3 && progress.speakingLevel === 3;
  const requirements = [
    progress.readingLevel < 3 ? "Unlock Reading Level 3" : null,
    progress.listeningLevel < 3 ? "Unlock Listening Level 3" : null,
    progress.writingLevel < 3 ? "Unlock Writing Level 3" : null,
    progress.speakingLevel < 3 ? "Unlock Speaking Level 3" : null
  ].filter(Boolean) as string[];

  return { unlocked, requirements };
}

export async function startGauntlet(userId: string) {
  const status = await getGauntletStatus(userId);
  if (!status.unlocked) throw new ApiError("Gauntlet is locked", 403);

  const store = await readStore();
  const session: GauntletSession = {
    id: crypto.randomUUID(),
    userId,
    startedAt: now(),
    completed: false,
    sections: [
      { id: crypto.randomUUID(), module: "reading", duration: 60 * 60, level: 3, completed: false },
      { id: crypto.randomUUID(), module: "listening", duration: 30 * 60, level: 3, completed: false },
      { id: crypto.randomUUID(), module: "writing", duration: 60 * 60, level: 3, completed: false },
      { id: crypto.randomUUID(), module: "speaking", duration: 14 * 60, level: 3, completed: false }
    ]
  };

  store.gauntletSessions[session.id] = session;
  await writeStore(store);
  return session;
}

export async function completeGauntletSection(userId: string, id: string, sectionId: string, input: { score?: number; metrics?: Record<string, unknown> }) {
  const store = await readStore();
  const session = store.gauntletSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Gauntlet session not found", 404);
  const section = session.sections.find((item) => item.id === sectionId);
  if (!section) throw new ApiError("Gauntlet section not found", 404);

  section.completed = true;
  section.score = input.score;
  section.metrics = input.metrics;
  const nextSection = session.sections.find((item) => !item.completed);
  await writeStore(store);
  return { nextSection, completed: !nextSection };
}

export async function completeGauntlet(userId: string, id: string) {
  const store = await readStore();
  const session = store.gauntletSessions[id];
  if (!session || session.userId !== userId) throw new ApiError("Gauntlet session not found", 404);

  session.completed = true;
  const progress = ensureProgress(store, userId);
  progress.gauntletCompleted = true;
  progress.updatedAt = now();
  const badgesAwarded = checkBadgesInternal(store, userId).map((badge) => badge.badgeType);
  await writeStore(store);
  return { completed: true, totalScore: session.sections.reduce((sum, section) => sum + (section.score ?? 0), 0), badgesAwarded };
}
