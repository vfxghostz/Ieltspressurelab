"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AudioLines,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  Headphones,
  Lock,
  LogIn,
  Map,
  Mic,
  Play,
  Radio,
  Send,
  Target,
  Timer,
  UserCircle2,
  Zap
} from "lucide-react";
import { supabase, type Database, type Json } from "@/integrations/supabase/client";
import {
  type ExamLevel,
  listeningTask,
  moduleSummaries,
  pressureProfile,
  readingTask,
  type ExamModuleId,
  type ModuleStatus,
  type PressureProfile,
  writingTask
} from "@/src/data/mockExamData";
import { accuracyToBand, calculateAccuracy, calculateWpm, checkAnswers, countWords, renderProgressBar } from "@/src/lib/examScoring";
import { readModuleRatings, saveModuleRating, type ModuleRating, type ModuleRatings } from "@/src/lib/moduleRatingsStorage";
import { pressureProfileAxes, readStoredPressureProfile } from "@/src/lib/pressureProfileStorage";

type TestResultInsert = Database["public"]["Tables"]["test_results"]["Insert"];

type HeaderView = "console" | "map" | "command";
type ReadingPhase = "setup" | "reading" | "recall" | "results";
type WritingPhase = "setup" | "topic" | "writing" | "results";
type StorageMode = "supabase-client" | "supabase" | "local-fallback";

interface ScoreSnapshot {
  id: string | null;
  module: ExamModuleId;
  band_score: number;
  accuracy: number;
  metrics: Json;
  storage: StorageMode;
  created_at: string;
}

const latestScoreKey = "ielts-pressure-lab-latest-score";

const moduleIcons: Record<ExamModuleId, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: FileText,
  speaking: Mic,
  gauntlet: Lock
};

const statusLabel: Record<ModuleStatus, string> = {
  stable: "Stable",
  watch: "Watch",
  critical: "Critical",
  locked: "Locked"
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function pressureProfileToJson(profile: PressureProfile): Json {
  return {
    timerAnxiety: profile.timerAnxiety,
    topicAnxiety: profile.topicAnxiety,
    socialAnxiety: profile.socialAnxiety,
    perfectionism: profile.perfectionism
  };
}

export function PressureLabSimulator() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const submittedRef = useRef(false);
  const writingStartedAtRef = useRef<number | null>(null);

  const [headerView, setHeaderView] = useState<HeaderView>("console");
  const [activeModule, setActiveModule] = useState<ExamModuleId>("reading");
  const [readingPhase, setReadingPhase] = useState<ReadingPhase>("setup");
  const [readingLevel, setReadingLevel] = useState<ExamLevel>(2);
  const [readingSeconds, setReadingSeconds] = useState(readingTask.readingSeconds);
  const [readingCompletedSeconds, setReadingCompletedSeconds] = useState<number | null>(null);
  const [recallSeconds, setRecallSeconds] = useState(readingTask.recallSeconds);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingResult, setReadingResult] = useState<{ accuracy: number; band: number; correct: number } | null>(null);

  const [listeningStarted, setListeningStarted] = useState(false);
  const [listeningLevel, setListeningLevel] = useState<ExamLevel>(2);
  const [listeningCurrentTime, setListeningCurrentTime] = useState(0);
  const [activeListeningQuestionId, setActiveListeningQuestionId] = useState<string | null>(null);
  const [listeningQuestionStartMs, setListeningQuestionStartMs] = useState<number | null>(null);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [missedListening, setMissedListening] = useState<Record<string, true>>({});

  const [writingPhase, setWritingPhase] = useState<WritingPhase>("setup");
  const [topicBombSeconds, setTopicBombSeconds] = useState(writingTask.topicBombSeconds);
  const [writingSeconds, setWritingSeconds] = useState(writingTask.writingSeconds);
  const [essayText, setEssayText] = useState("");
  const [erasuresUsed, setErasuresUsed] = useState(writingTask.erasuresStart);
  const [submitStatus, setSubmitStatus] = useState("");
  const [currentPressureProfile, setCurrentPressureProfile] = useState<PressureProfile>(pressureProfile);
  const [moduleRatings, setModuleRatings] = useState<ModuleRatings>({});

  const wordCount = useMemo(() => countWords(essayText), [essayText]);
  const elapsedWritingSeconds = writingStartedAtRef.current ? Math.max(1, Math.round((Date.now() - writingStartedAtRef.current) / 1000)) : 0;
  const writingWpm = calculateWpm(wordCount, elapsedWritingSeconds);
  const forecastWords = writingWpm > 0 ? Math.round(writingWpm * (writingTask.writingSeconds / 60)) : 0;

  const resetSubmissionLock = () => {
    submittedRef.current = false;
    setSubmitStatus("");
  };

  useEffect(() => {
    setCurrentPressureProfile(readStoredPressureProfile());
    setModuleRatings(readModuleRatings());

    const handleFocus = () => {
      setCurrentPressureProfile(readStoredPressureProfile());
      setModuleRatings(readModuleRatings());
    };
    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const persistModuleRating = (rating: ModuleRating) => {
    saveModuleRating(rating);
    setModuleRatings((current) => ({
      ...current,
      [rating.module]: rating
    }));
  };

  const submitResult = useCallback(
    async (payload: TestResultInsert) => {
      if (submittedRef.current) {
        return;
      }

      submittedRef.current = true;
      setSubmitStatus("Submitting result...");

      const sessionResponse = await supabase.auth.getSession();
      const userId = sessionResponse.data.session?.user.id ?? payload.user_id ?? null;
      const finalPayload: TestResultInsert = {
        ...payload,
        user_id: userId
      };

      const clientAttempt = await supabase.from("test_results").insert(finalPayload);
      let snapshot: ScoreSnapshot = {
        id: `client-${Date.now()}`,
        module: finalPayload.module as ExamModuleId,
        band_score: finalPayload.band_score,
        accuracy: finalPayload.accuracy,
        metrics: finalPayload.metrics ?? {},
        storage: "supabase-client",
        created_at: new Date().toISOString()
      };

      if (clientAttempt.error) {
        const response = await fetch("/api/test-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload)
        });
        const resultPayload = (await response.json()) as {
          storage?: StorageMode;
          result?: {
            id?: string | null;
            module: string;
            band_score: number;
            accuracy: number;
            metrics: Json | null;
            created_at?: string;
          };
        };

        if (resultPayload.result) {
          snapshot = {
            id: resultPayload.result.id ?? null,
            module: resultPayload.result.module as ExamModuleId,
            band_score: resultPayload.result.band_score,
            accuracy: resultPayload.result.accuracy,
            metrics: resultPayload.result.metrics ?? {},
            storage: resultPayload.storage ?? "local-fallback",
            created_at: resultPayload.result.created_at ?? new Date().toISOString()
          };
        }
      }

      window.localStorage.setItem(latestScoreKey, JSON.stringify(snapshot));
      router.push(`/score${snapshot.id ? `?result=${encodeURIComponent(snapshot.id)}` : ""}`);
    },
    [router]
  );

  const submitReading = useCallback(() => {
    const checks = checkAnswers(readingTask.questions, readingAnswers);
    const correct = checks.filter((check) => check.correct).length;
    const accuracy = calculateAccuracy(correct, readingTask.questions.length);
    const band = accuracyToBand(accuracy);
    const readElapsed = readingCompletedSeconds ?? (readingTask.readingSeconds - readingSeconds || readingTask.readingSeconds);
    const wpm = calculateWpm(readingTask.wordCount, Math.max(1, readElapsed));

    setReadingResult({ accuracy, band, correct });
    setReadingPhase("results");
    persistModuleRating({
      module: "reading",
      bandScore: band,
      accuracy,
      primary: `${wpm} wpm`,
      secondary: `${correct}/${readingTask.questions.length} correct · L${readingLevel}`,
      updatedAt: new Date().toISOString()
    });

    void submitResult({
      module: "reading",
      band_score: band,
      accuracy,
      metrics: {
        correct,
        total: readingTask.questions.length,
        checks: checks.map((check) => ({
          id: check.id,
          expected: check.expected,
          actual: check.actual,
          correct: check.correct
        })),
        wpm,
        reading_wpm: wpm,
        reading_elapsed_seconds: readElapsed,
        level: readingLevel,
        pressure_profile: pressureProfileToJson(currentPressureProfile),
        phase: readingPhase,
        progress_to_l3: accuracy
      }
    });
  }, [currentPressureProfile, readingAnswers, readingCompletedSeconds, readingLevel, readingPhase, readingSeconds, submitResult]);

  const submitListening = useCallback(() => {
    const checks = checkAnswers(listeningTask.questions, listeningAnswers);
    const correct = checks.filter((check) => check.correct).length;
    const accuracy = calculateAccuracy(correct, listeningTask.questions.length);
    const band = accuracyToBand(accuracy);
    const missed = listeningTask.questions.filter((question) => missedListening[question.id]).length;
    persistModuleRating({
      module: "listening",
      bandScore: band,
      accuracy,
      primary: `${missed} missed`,
      secondary: `${correct}/${listeningTask.questions.length} correct · L${listeningLevel}`,
      updatedAt: new Date().toISOString()
    });

    void submitResult({
      module: "listening",
      band_score: band,
      accuracy,
      metrics: {
        correct,
        missed,
        total: listeningTask.questions.length,
        checks: checks.map((check) => ({
          id: check.id,
          expected: check.expected,
          actual: check.actual,
          correct: check.correct
        })),
        elapsed_audio_seconds: Math.round(listeningCurrentTime),
        listening_source: listeningTask.audioUrl,
        missed_answers: missed,
        level: listeningLevel,
        pressure_profile: pressureProfileToJson(currentPressureProfile)
      }
    });
  }, [currentPressureProfile, listeningAnswers, listeningCurrentTime, listeningLevel, missedListening, submitResult]);

  const submitWriting = useCallback(() => {
    const targetAccuracy = Math.min(100, Math.round((wordCount / writingTask.targetWords) * 100));
    const pressurePenalty = erasuresUsed >= writingTask.erasuresLimit ? 10 : 0;
    const accuracy = Math.max(15, Math.min(100, targetAccuracy - pressurePenalty));
    const band = accuracyToBand(accuracy);
    persistModuleRating({
      module: "writing",
      bandScore: band,
      accuracy,
      primary: `${wordCount} words`,
      secondary: `${writingWpm} wpm · ${erasuresUsed}/${writingTask.erasuresLimit} erasures`,
      updatedAt: new Date().toISOString()
    });

    void submitResult({
      module: "writing",
      band_score: band,
      accuracy,
      metrics: {
        essay_text: essayText,
        word_count: wordCount,
        erasures_used: erasuresUsed,
        erasures_limit: writingTask.erasuresLimit,
        wpm: writingWpm,
        forecast_words: forecastWords,
        target_words: writingTask.targetWords,
        pressure_profile: pressureProfileToJson(currentPressureProfile)
      }
    });
  }, [currentPressureProfile, erasuresUsed, essayText, forecastWords, submitResult, wordCount, writingWpm]);

  useEffect(() => {
    resetSubmissionLock();
    setSubmitStatus("");
  }, [activeModule]);

  useEffect(() => {
    if (readingPhase !== "reading") {
      return;
    }

    const timerId = window.setInterval(() => {
      setReadingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [readingPhase]);

  useEffect(() => {
    if (readingPhase === "reading" && readingSeconds === 0) {
      setReadingCompletedSeconds((current) => current ?? readingTask.readingSeconds);
      setReadingPhase(readingLevel === 1 ? "recall" : "recall");
      setRecallSeconds(readingTask.recallSeconds);
    }
  }, [readingLevel, readingPhase, readingSeconds]);

  useEffect(() => {
    if (!listeningStarted || listeningLevel === 1) {
      return;
    }

    const timerId = window.setInterval(() => {
      setListeningCurrentTime((current) => Math.min(listeningTask.durationSeconds, current + 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [listeningLevel, listeningStarted]);

  useEffect(() => {
    if (!listeningStarted || listeningLevel === 1 || activeListeningQuestionId || listeningCurrentTime >= listeningTask.durationSeconds) {
      return;
    }

    const nextQuestion = listeningTask.questions.find(
      (question) => listeningCurrentTime >= question.timecode && !listeningAnswers[question.id] && !missedListening[question.id]
    );

    if (nextQuestion) {
      setActiveListeningQuestionId(nextQuestion.id);
      setListeningQuestionStartMs(Date.now());
    }
  }, [activeListeningQuestionId, listeningAnswers, listeningCurrentTime, listeningLevel, listeningStarted, missedListening]);

  useEffect(() => {
    if (listeningStarted && listeningLevel !== 1 && listeningCurrentTime >= listeningTask.durationSeconds) {
      submitListening();
    }
  }, [listeningCurrentTime, listeningLevel, listeningStarted, submitListening]);

  useEffect(() => {
    if (readingPhase !== "recall") {
      return;
    }

    const timerId = window.setInterval(() => {
      setRecallSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [readingPhase]);

  useEffect(() => {
    if (readingPhase === "recall" && recallSeconds === 0) {
      submitReading();
    }
  }, [readingPhase, recallSeconds, submitReading]);

  useEffect(() => {
    if (!listeningStarted || listeningLevel === 1 || !activeListeningQuestionId || !listeningQuestionStartMs) {
      return;
    }

    const timerId = window.setInterval(() => {
      if (Date.now() - listeningQuestionStartMs >= listeningTask.answerWindowSeconds * 1000) {
        setMissedListening((current) => ({ ...current, [activeListeningQuestionId]: true }));
        setActiveListeningQuestionId(null);
        setListeningQuestionStartMs(null);
      }
    }, 200);

    return () => window.clearInterval(timerId);
  }, [activeListeningQuestionId, listeningLevel, listeningQuestionStartMs, listeningStarted]);

  useEffect(() => {
    if (writingPhase !== "topic") {
      return;
    }

    const timerId = window.setInterval(() => {
      setTopicBombSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [writingPhase]);

  useEffect(() => {
    if (writingPhase === "topic" && topicBombSeconds === 0) {
      writingStartedAtRef.current = Date.now();
      setWritingPhase("writing");
    }
  }, [topicBombSeconds, writingPhase]);

  useEffect(() => {
    if (writingPhase !== "writing") {
      return;
    }

    const timerId = window.setInterval(() => {
      setWritingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [writingPhase]);

  useEffect(() => {
    if (writingPhase === "writing" && writingSeconds === 0) {
      submitWriting();
    }
  }, [submitWriting, writingPhase, writingSeconds]);

  const startReading = () => {
    resetSubmissionLock();
    setReadingAnswers({});
    setReadingResult(null);
    setReadingCompletedSeconds(null);
    setReadingSeconds(readingTask.readingSeconds);
    setRecallSeconds(readingTask.recallSeconds);
    setReadingPhase("reading");
  };

  const finishReading = () => {
    const elapsedSeconds = Math.max(1, readingTask.readingSeconds - readingSeconds);
    setReadingCompletedSeconds(elapsedSeconds);
    setReadingPhase("recall");
    setRecallSeconds(readingTask.recallSeconds);
  };

  const startListening = () => {
    resetSubmissionLock();
    setListeningStarted(true);
    setListeningCurrentTime(0);
    setListeningAnswers({});
    setMissedListening({});
    setActiveListeningQuestionId(null);
    setListeningQuestionStartMs(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    }
  };

  const resetListeningLevel = (nextLevel: ExamLevel) => {
    setListeningLevel(nextLevel);
    setListeningStarted(false);
    setListeningCurrentTime(0);
    setListeningAnswers({});
    setMissedListening({});
    setActiveListeningQuestionId(null);
    setListeningQuestionStartMs(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleListeningTimeUpdate = () => {
    setListeningCurrentTime(audioRef.current?.currentTime ?? 0);
  };

  const answerListeningQuestion = (questionId: string, value: string) => {
    setListeningAnswers((current) => ({ ...current, [questionId]: value }));
    setActiveListeningQuestionId(null);
    setListeningQuestionStartMs(null);
  };

  const startWriting = () => {
    resetSubmissionLock();
    writingStartedAtRef.current = null;
    setEssayText("");
    setErasuresUsed(writingTask.erasuresStart);
    setTopicBombSeconds(writingTask.topicBombSeconds);
    setWritingSeconds(writingTask.writingSeconds);
    setWritingPhase("topic");
  };

  const handleEssayKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Backspace" && event.key !== "Delete") {
      return;
    }

    if (erasuresUsed >= writingTask.erasuresLimit) {
      event.preventDefault();
      return;
    }

    setErasuresUsed((current) => Math.min(writingTask.erasuresLimit, current + 1));
  };

  return (
    <main className="pressure-output-shell">
      <header className="output-header">
        <div className="output-brand">
          <span className="output-brand-mark">
            <Zap size={18} />
          </span>
          <div>
            <strong>IELTS Pressure Lab</strong>
            <small>Real-time exam pressure simulator</small>
          </div>
        </div>

        <nav className="output-header-nav" aria-label="Primary product views">
          <button type="button" aria-pressed={headerView === "console"} onClick={() => setHeaderView("console")}>
            <Radio size={16} />
            <span>Module Console</span>
          </button>
          <button type="button" aria-pressed={headerView === "map"} onClick={() => setHeaderView("map")}>
            <Map size={16} />
            <span>Training Map</span>
          </button>
          <button type="button" aria-pressed={headerView === "command"} onClick={() => setHeaderView("command")}>
            <Target size={16} />
            <span>Command Center</span>
          </button>
        </nav>

        <div className="output-header-status" aria-label="System indicators">
          <span title="idle">○</span>
          <span title="active">●</span>
          <span title="locked">◆</span>
          <button type="button" className="profile-structure-button">
            <UserCircle2 size={19} />
            <span>Profile</span>
          </button>
          <button type="button" className="login-structure-button">
            <LogIn size={17} />
            <span>Login</span>
          </button>
        </div>
      </header>

      <aside className="output-sidebar" aria-label="IELTS module sidebar">
        <div className="sidebar-title">
          <ClipboardList size={17} />
          <span>SIDEBAR</span>
        </div>
        {moduleSummaries.map((module) => {
          const Icon = moduleIcons[module.id];
          return (
            <button
              type="button"
              key={module.id}
              className="module-nav-button"
              data-status={module.status}
              aria-pressed={activeModule === module.id}
              onClick={() => setActiveModule(module.id)}
            >
              <Icon size={18} />
              <span>
                <strong>{module.label}</strong>
                <small>{module.description}</small>
              </span>
              <em>{statusLabel[module.status]}</em>
            </button>
          );
        })}
      </aside>

      <section className="output-workspace" aria-label="IELTS Pressure Lab workspace">
        {headerView === "map" && <TrainingMapPanel onOpenModule={setActiveModule} />}
        {headerView === "command" && <CommandOverviewPanel activeModule={activeModule} submitStatus={submitStatus} profile={currentPressureProfile} ratings={moduleRatings} />}
        {headerView === "console" && (
          <>
            {activeModule === "reading" && (
              <ReadingModule
                phase={readingPhase}
                level={readingLevel}
                seconds={readingSeconds}
                recallSeconds={recallSeconds}
                answers={readingAnswers}
                result={readingResult}
                profile={currentPressureProfile}
                onLevelChange={setReadingLevel}
                onStart={startReading}
                onFinish={finishReading}
                onAnswer={(id, value) => setReadingAnswers((current) => ({ ...current, [id]: value }))}
                onSubmit={submitReading}
                submitStatus={submitStatus}
              />
            )}
            {activeModule === "listening" && (
              <ListeningModule
                audioRef={audioRef}
                level={listeningLevel}
                started={listeningStarted}
                currentTime={listeningCurrentTime}
                activeQuestionId={activeListeningQuestionId}
                questionStartMs={listeningQuestionStartMs}
                answers={listeningAnswers}
                missed={missedListening}
                onStart={startListening}
                onLevelChange={resetListeningLevel}
                onTimeUpdate={handleListeningTimeUpdate}
                onAnswer={answerListeningQuestion}
                onSubmit={submitListening}
                submitStatus={submitStatus}
              />
            )}
            {activeModule === "writing" && (
              <WritingModule
                phase={writingPhase}
                topicBombSeconds={topicBombSeconds}
                writingSeconds={writingSeconds}
                essayText={essayText}
                erasuresUsed={erasuresUsed}
                wordCount={wordCount}
                wpm={writingWpm}
                forecastWords={forecastWords}
                onStart={startWriting}
                onEssayChange={setEssayText}
                onEssayKeyDown={handleEssayKeyDown}
                onSubmit={submitWriting}
                submitStatus={submitStatus}
              />
            )}
            {(activeModule === "speaking" || activeModule === "gauntlet") && <LockedModulePanel moduleId={activeModule} />}
          </>
        )}
      </section>
    </main>
  );
}

function TrainingMapPanel({ onOpenModule }: { onOpenModule: (module: ExamModuleId) => void }) {
  return (
    <div className="output-panel">
      <div className="output-panel-heading">
        <span>TRAINING MAP</span>
        <h1>Unlock exam conditions by module</h1>
      </div>
      <div className="output-lane-grid">
        {moduleSummaries.map((module) => (
          <button type="button" key={module.id} className="output-lane" data-status={module.status} onClick={() => onOpenModule(module.id)}>
            <strong>{module.label}</strong>
            <span>{module.level}</span>
            <small>{module.description}</small>
            <em>{renderProgressBar(module.status === "locked" ? 20 : module.status === "critical" ? 48 : module.status === "watch" ? 64 : 78)}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommandOverviewPanel({
  activeModule,
  submitStatus,
  profile,
  ratings
}: {
  activeModule: ExamModuleId;
  submitStatus: string;
  profile: PressureProfile;
  ratings: ModuleRatings;
}) {
  const ratingRows: Array<{ module: ExamModuleId; label: string; fallback: string }> = [
    { module: "reading", label: "Reading", fallback: "No reading result yet" },
    { module: "listening", label: "Listening", fallback: "No listening result yet" },
    { module: "writing", label: "Writing", fallback: "No writing result yet" },
    { module: "speaking", label: "Speaking", fallback: "Not started" },
    { module: "gauntlet", label: "Gauntlet", fallback: "Locked until all modules reach Level 3" }
  ];

  return (
    <div className="output-panel command-output-panel">
      <div className="output-panel-heading">
        <span>COMMAND CENTER</span>
        <h1>Section ratings and next-session telemetry</h1>
      </div>
      <div className="telemetry-grid">
        <MetricCard label="Active Module" value={activeModule.toUpperCase()} detail="Selected from SIDEBAR" />
        {ratingRows.map((row) => {
          const rating = ratings[row.module];
          return (
            <MetricCard
              key={row.module}
              label={row.label}
              value={rating ? `Band ${rating.bandScore.toFixed(1)} · ${rating.accuracy}%` : row.fallback}
              detail={rating ? `${rating.primary} · ${rating.secondary}` : row.module === "gauntlet" ? "LOCKED" : "Complete a section to generate telemetry"}
            />
          );
        })}
        {pressureProfileAxes.map((axis) => (
          <MetricCard key={axis.key} label={axis.label} value={`${profile[axis.key]}/10`} detail={renderProgressBar(profile[axis.key] * 10)} />
        ))}
        <MetricCard label="Submit State" value={submitStatus || "Ready"} detail="Supabase + local fallback" />
      </div>
    </div>
  );
}

function ReadingModule({
  phase,
  level,
  seconds,
  recallSeconds,
  answers,
  result,
  profile,
  onLevelChange,
  onStart,
  onFinish,
  onAnswer,
  onSubmit,
  submitStatus
}: {
  phase: ReadingPhase;
  level: ExamLevel;
  seconds: number;
  recallSeconds: number;
  answers: Record<string, string>;
  result: { accuracy: number; band: number; correct: number } | null;
  profile: PressureProfile;
  onLevelChange: (level: ExamLevel) => void;
  onStart: () => void;
  onFinish: () => void;
  onAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
  submitStatus: string;
}) {
  const isCritical = phase === "reading" && seconds <= 30;
  const wpmPreview = calculateWpm(readingTask.wordCount, Math.max(1, readingTask.readingSeconds - seconds || 1));
  const activeLevel = readingTask.levels.find((item) => item.level === level) ?? readingTask.levels[1];
  const showReadingTimer = level !== 3;
  const passageHidden = phase === "recall" && level !== 1;
  const showQuestions = phase === "recall";
  const showRecallTimer = phase === "recall" && level !== 3;
  const passageVisible = phase === "reading" || (phase === "recall" && level === 1);

  if (phase === "setup") {
    return (
      <div className="output-panel">
        <div className="output-panel-heading">
          <span>READING / LEVEL SYSTEM</span>
          <h1>Choose level and enter timed reading</h1>
        </div>
        <div className="level-card-grid">
          {readingTask.levels.map((item) => (
            <button type="button" key={item.level} className="level-card" aria-pressed={level === item.level} onClick={() => onLevelChange(item.level)}>
              <strong>L{item.level}</strong>
              <span>{item.name}</span>
              <small>{item.pressure}</small>
            </button>
          ))}
        </div>
        <button type="button" className="output-primary-button" onClick={onStart}>
          <Play size={18} />
          Start Reading Sprint
        </button>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="output-panel">
        <div className="output-panel-heading">
          <span>READING RESULTS</span>
          <h1>Accuracy {result?.accuracy ?? 0}% · Band {result?.band.toFixed(1) ?? "0.0"}</h1>
        </div>
        <div className="result-band-card">
          <strong>{renderProgressBar(result?.accuracy ?? 0)}</strong>
          <span>Progress to Level 3: {result?.accuracy ?? 0}%</span>
          <small>{result?.correct ?? 0}/{readingTask.questions.length} answers correct</small>
        </div>
        {submitStatus && <p className="submit-status">{submitStatus}</p>}
      </div>
    );
  }

  return (
    <div className="reading-split">
      <article className="output-panel reading-text-panel" data-hidden={passageHidden}>
        <div className="output-panel-heading">
          <span>READING LEVEL {level} / {activeLevel.name}</span>
          <h1>{readingTask.title}</h1>
        </div>
        {showReadingTimer ? (
          <div className={isCritical ? "critical-timer timer-banner" : "timer-banner"}>
            <Timer size={18} />
            <strong>{isCritical ? "Critical" : level === 1 ? "Guided timer" : "Reading locks in"}</strong>
            <span>{formatTime(seconds)}</span>
          </div>
        ) : (
          <div className="timer-banner hidden-timer-banner">
            <Timer size={18} />
            <strong>Level 3 hidden timer</strong>
            <span>Blind</span>
          </div>
        )}
        {passageVisible ? (
          <>
            <p className="reading-passage">{readingTask.text}</p>
            {phase === "reading" && (
              <button type="button" className="output-primary-button finish-reading-button" onClick={onFinish}>
                <CheckCircle2 size={18} />
                I finished / Я завершил
              </button>
            )}
          </>
        ) : (
          <div className="passage-gone">
            {level === 1 ? <BookOpen size={22} /> : <Lock size={22} />}
            {level === 1 ? "Guided Level 1: passage stays visible while you answer." : "Passage hidden. Answer from memory only."}
          </div>
        )}
      </article>

      <aside className="output-panel telemetry-panel">
        <div className="output-panel-heading">
          <span>TELEMETRY</span>
          <h1>{phase === "recall" ? "Memory Recall" : "Pressure Profile"}</h1>
        </div>
        <MetricCard label="Reading Speed" value={`${wpmPreview} wpm`} detail={renderProgressBar(Math.min(100, (wpmPreview / 220) * 100))} />
        <PressureBars profile={profile} />
        <div className="memory-questions">
          {showRecallTimer ? (
            <div className="timer-banner recall-banner">
              <Timer size={18} />
              <strong>{level === 1 ? "Answer timer" : "Recall timer"}</strong>
              <span>{formatTime(recallSeconds)}</span>
            </div>
          ) : (
            <div className="timer-banner hidden-timer-banner">
              <Timer size={18} />
              <strong>Recall guidance hidden</strong>
              <span>L3</span>
            </div>
          )}
          {showQuestions ? (
            readingTask.questions.map((question) => (
              <QuestionChoice key={question.id} question={question} value={answers[question.id] ?? ""} onAnswer={onAnswer} />
            ))
          ) : (
            <div className="passage-gone">
              <Lock size={20} />
              Questions unlock after reading is finished.
            </div>
          )}
          <button type="button" className="output-primary-button" onClick={onSubmit} disabled={!showQuestions}>
            <Send size={18} />
            Submit Reading
          </button>
          {submitStatus && <p className="submit-status">{submitStatus}</p>}
        </div>
      </aside>
    </div>
  );
}

function ListeningModule({
  audioRef,
  level,
  started,
  currentTime,
  activeQuestionId,
  questionStartMs,
  answers,
  missed,
  onStart,
  onLevelChange,
  onTimeUpdate,
  onAnswer,
  onSubmit,
  submitStatus
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  level: ExamLevel;
  started: boolean;
  currentTime: number;
  activeQuestionId: string | null;
  questionStartMs: number | null;
  answers: Record<string, string>;
  missed: Record<string, true>;
  onStart: () => void;
  onLevelChange: (level: ExamLevel) => void;
  onTimeUpdate: () => void;
  onAnswer: (questionId: string, value: string) => void;
  onSubmit: () => void;
  submitStatus: string;
}) {
  const activeQuestion = listeningTask.questions.find((question) => question.id === activeQuestionId);
  const activeLevel = listeningTask.levels.find((item) => item.level === level) ?? listeningTask.levels[1];
  const activeSubtitle = listeningTask.subtitles.find((cue) => currentTime >= cue.start && currentTime < cue.end);
  const answerWindowLeft = activeQuestion
    ? Math.max(0, listeningTask.answerWindowSeconds - Math.floor(currentTime - activeQuestion.timecode))
    : questionStartMs
      ? Math.max(0, listeningTask.answerWindowSeconds - Math.floor((Date.now() - questionStartMs) / 1000))
      : listeningTask.answerWindowSeconds;
  const answeredCount = Object.keys(answers).length;
  const missedCount = Object.keys(missed).length;
  const oneShotMode = level !== 1;
  const visibleQuestionTimer = level === 2;
  const visibleProgress = level !== 3;
  const visibleQuestions = level === 1 ? listeningTask.questions : activeQuestion ? [activeQuestion] : [];

  return (
    <div className="output-panel listening-panel">
      <div className="output-panel-heading">
        <span>LISTENING LEVEL {level} / {activeLevel.name}</span>
        <h1>{listeningTask.sourceLabel}</h1>
      </div>

      <div className="level-card-grid listening-level-grid">
        {listeningTask.levels.map((item) => (
          <button type="button" key={item.level} className="level-card" aria-pressed={level === item.level} onClick={() => onLevelChange(item.level)}>
            <strong>L{item.level}</strong>
            <span>{item.name}</span>
            <small>{item.pressure}</small>
          </button>
        ))}
      </div>

      <div className="native-audio-shell" data-level={level}>
        <audio
          ref={audioRef}
          src={listeningTask.audioUrl}
          controls={level === 1}
          controlsList="nodownload noplaybackrate"
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
        />
        <div className="tedx-standby">
          <Headphones size={24} />
          <strong>{oneShotMode ? "TEDx MP3 is armed for one shot" : "Guided MP3 practice"}</strong>
          <span>
            {oneShotMode
              ? "Press Play Once. Questions open by timed windows. No replay inside the drill."
              : "Level 1 keeps native controls, rewind, pause, subtitles/cues, and all questions available."}
          </span>
        </div>
        {level === 1 && (
          <div className="subtitle-cue">
            <AudioLines size={18} />
            <strong>Timed gist cue</strong>
            <span>{activeSubtitle?.text ?? "Press play and listen for the first idea."}</span>
          </div>
        )}
      </div>

      <div className="audio-console">
        {!started || level === 1 ? (
          <button type="button" className="output-primary-button" onClick={onStart}>
            <Play size={18} />
            {level === 1 ? "Play / Reset Guided Audio" : "Play TEDx Once"}
          </button>
        ) : (
          <div className="one-shot-indicator">
            <AudioLines size={20} />
            <strong>TEDx running</strong>
            <span>{visibleProgress ? `${Math.round(currentTime)} / ${listeningTask.durationSeconds}s` : "Progress hidden"}</span>
          </div>
        )}
        <MetricCard
          label="Answered"
          value={`${answeredCount}/${listeningTask.questions.length}`}
          detail={renderProgressBar((answeredCount / listeningTask.questions.length) * 100)}
        />
        <MetricCard label="Missed" value={`${missedCount}`} detail={level === 1 ? "Guided mode: no miss lock" : missedCount ? "ANSWER MISSED" : "No misses yet"} />
      </div>

      <div className="listening-question-stack">
        {visibleQuestions.length > 0 ? (
          visibleQuestions.map((question) => (
            <div className="active-listening-question" key={question.id}>
              {oneShotMode && (
                visibleQuestionTimer ? (
                  <div className="timer-banner critical-timer">
                    <Timer size={18} />
                    <strong>Answer window</strong>
                    <span>{answerWindowLeft}s</span>
                  </div>
                ) : (
                  <div className="timer-banner hidden-timer-banner">
                    <Timer size={18} />
                    <strong>Hidden answer window</strong>
                    <span>L3</span>
                  </div>
                )
              )}
              <QuestionChoice question={question} value={answers[question.id] ?? ""} onAnswer={onAnswer} />
            </div>
          ))
        ) : (
          <div className="passage-gone">
            <Circle size={20} />
            {started ? "Waiting for the next timed question." : "Start the MP3 to arm timed questions."}
          </div>
        )}
        <div className="question-timeline">
          {listeningTask.questions.map((question) => (
            <span key={question.id} data-state={answers[question.id] ? "answered" : missed[question.id] ? "missed" : currentTime >= question.timecode ? "active" : "pending"}>
              {question.id.replace("l-q", "")}
            </span>
          ))}
        </div>
        <button type="button" className="output-secondary-button" onClick={onSubmit}>
          Submit Listening Now
        </button>
        {submitStatus && <p className="submit-status">{submitStatus}</p>}
      </div>
    </div>
  );
}

function WritingModule({
  phase,
  topicBombSeconds,
  writingSeconds,
  essayText,
  erasuresUsed,
  wordCount,
  wpm,
  forecastWords,
  onStart,
  onEssayChange,
  onEssayKeyDown,
  onSubmit,
  submitStatus
}: {
  phase: WritingPhase;
  topicBombSeconds: number;
  writingSeconds: number;
  essayText: string;
  erasuresUsed: number;
  wordCount: number;
  wpm: number;
  forecastWords: number;
  onStart: () => void;
  onEssayChange: (value: string) => void;
  onEssayKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  submitStatus: string;
}) {
  const erasuresLocked = erasuresUsed >= writingTask.erasuresLimit;

  return (
    <div className="writing-grid">
      <article className="output-panel">
        <div className="output-panel-heading">
          <span>WRITING · L1 THE FORGE</span>
          <h1>{writingTask.title}</h1>
        </div>
        {phase === "setup" && (
          <button type="button" className="output-primary-button" onClick={onStart}>
            <Zap size={18} />
            Arm Topic Bomb
          </button>
        )}
        {phase === "topic" && (
          <div className="topic-bomb">
            <AlertTriangle size={22} />
            <strong>Topic Bomb</strong>
            <span>{topicBombSeconds}s</span>
          </div>
        )}
        <p className="writing-topic">{writingTask.topic}</p>
        <textarea
          value={essayText}
          onChange={(event) => onEssayChange(event.target.value)}
          onKeyDown={onEssayKeyDown}
          disabled={phase !== "writing"}
          placeholder={phase === "writing" ? "Write without relying on deletion..." : "Topic locked until bomb reaches zero."}
        />
        <button type="button" className="output-primary-button" onClick={onSubmit} disabled={phase === "setup" || phase === "topic"}>
          <Send size={18} />
          Submit Writing
        </button>
        {submitStatus && <p className="submit-status">{submitStatus}</p>}
      </article>

      <aside className="output-panel">
        <div className="output-panel-heading">
          <span>PACE TRACKER</span>
          <h1>{formatTime(writingSeconds)}</h1>
        </div>
        <MetricCard label="Words" value={`${wordCount}/${writingTask.targetWords}`} detail={renderProgressBar(Math.min(100, (wordCount / writingTask.targetWords) * 100))} />
        <MetricCard label="Pace" value={`${wpm} wpm`} detail={`Forecast: ${forecastWords} words`} />
        <MetricCard label="Erasures" value={`${erasuresUsed}/${writingTask.erasuresLimit}`} detail={erasuresLocked ? "Backspace/Delete locked" : "Deletion still available"} />
      </aside>
    </div>
  );
}

function LockedModulePanel({ moduleId }: { moduleId: ExamModuleId }) {
  return (
    <div className="output-panel">
      <div className="output-panel-heading">
        <span>{moduleId.toUpperCase()}</span>
        <h1>{moduleId === "gauntlet" ? "Gauntlet locked" : "Speaking structure ready"}</h1>
      </div>
      <div className="passage-gone">
        <Lock size={22} />
        {moduleId === "gauntlet"
          ? "Reading, Listening, Writing and Speaking must reach Level 3 before the uninterrupted exam opens."
          : "Speaking cold-start mechanics are scaffolded for the next build phase."}
      </div>
    </div>
  );
}

function QuestionChoice({
  question,
  value,
  disabled,
  onAnswer
}: {
  question: { id: string; prompt: string; options: string[] };
  value: string;
  disabled?: boolean;
  onAnswer: (id: string, value: string) => void;
}) {
  return (
    <fieldset className="choice-question" disabled={disabled}>
      <legend>{question.prompt}</legend>
      {question.options.map((option) => (
        <button type="button" key={option} aria-pressed={value === option} onClick={() => onAnswer(question.id, option)}>
          {option}
        </button>
      ))}
    </fieldset>
  );
}

function PressureBars({ profile }: { profile: PressureProfile }) {
  return (
    <div className="pressure-bars">
      {pressureProfileAxes.map((axis) => (
        <div key={axis.key}>
          <span>{axis.label}</span>
          <strong>{renderProgressBar(profile[axis.key] * 10)}</strong>
          <em>{profile[axis.key]}/10</em>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
