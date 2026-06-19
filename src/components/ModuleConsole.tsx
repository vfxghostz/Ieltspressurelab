"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  BookOpenText,
  Camera,
  CheckCircle2,
  FileText,
  Headphones,
  LockKeyhole,
  Mic2,
  PenLine,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  TimerReset,
  Trophy
} from "lucide-react";
import {
  listeningTrack,
  moduleDefinitions,
  moduleOrder,
  readingPassage,
  speakingQuestions,
  writingTopic
} from "@/src/data/module-construction";
import { badges, pressureAxes, skillProgress } from "@/src/data/ielts";
import { uiCopy } from "@/src/i18n/ui";
import type { Locale, PressureLevel } from "@/src/types";
import type { ModuleId, ModuleLevel } from "@/src/data/module-construction";

type ModuleScreen = "setup" | "active" | "locked" | "results";
type SpeakingStage = "cold-start" | "part1" | "dilemma" | "post-mortem";

const moduleIcons = {
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
  gauntlet: Trophy
} satisfies Record<ModuleId, typeof BookOpenText>;

const copy = {
  en: {
    moduleNav: "Exam modules",
    chooseLevel: "Choose pressure level",
    currentRule: "Current constraint",
    start: "Start session",
    focus: "Focus mode",
    exitFocus: "Exit focus",
    lockText: "Lock text",
    submitAnswers: "Submit answers",
    revealText: "Reveal text",
    repeat: "Repeat",
    nextPassage: "Next passage",
    unavailable: "Unavailable",
    requires: "Requires",
    track: "Track",
    noPause: "No pause. No rewind.",
    answerNow: "Answer window",
    markAnswered: "Mark answered",
    missedIt: "Missed it",
    skipped: "Skip early",
    topicBomb: "Topic bomb",
    planning: "Planning window",
    essay: "Essay editor",
    erasures: "Erasures",
    limitHit: "Deletion limit reached. You can only add text now.",
    submitEssay: "Submit essay",
    recovery: "Recovery mode: write the next topic sentence before editing anything.",
    cameraSlot: "Camera preview slot",
    neutralFace: "Neutral face",
    endAnswer: "End answer",
    dilemma: "Dilemma question",
    postMortem: "Post-mortem",
    noRightAnswer: "There is no right answer. Reasoning matters.",
    lockedGauntlet: "Gauntlet locked",
    beginGauntlet: "Begin Gauntlet",
    telemetry: "Telemetry",
    pressureProfile: "Pressure profile",
    personalBadges: "Personal badges",
    pace: "Pace",
    readiness: "Readiness",
    result: "Session result",
    selfReview: "Self-review only. No AI score, no comparison."
  },
  ru: {
    moduleNav: "Экзаменационные модули",
    chooseLevel: "Выбор уровня давления",
    currentRule: "Текущее ограничение",
    start: "Начать сессию",
    focus: "Focus mode",
    exitFocus: "Выйти из focus",
    lockText: "Закрыть текст",
    submitAnswers: "Отправить ответы",
    revealText: "Показать текст",
    repeat: "Повторить",
    nextPassage: "Следующий пассаж",
    unavailable: "Недоступно",
    requires: "Требуется",
    track: "Трек",
    noPause: "Без паузы. Без перемотки.",
    answerNow: "Окно ответа",
    markAnswered: "Ответить",
    missedIt: "Пропустил",
    skipped: "Пропустить досрочно",
    topicBomb: "Topic bomb",
    planning: "Окно планирования",
    essay: "Редактор эссе",
    erasures: "Удаления",
    limitHit: "Лимит удалений исчерпан. Теперь можно только добавлять текст.",
    submitEssay: "Отправить эссе",
    recovery: "Recovery mode: сначала напиши следующий topic sentence, потом редактируй.",
    cameraSlot: "Слот камеры",
    neutralFace: "Нейтральное лицо",
    endAnswer: "Закончить ответ",
    dilemma: "Dilemma question",
    postMortem: "Post-mortem",
    noRightAnswer: "Правильного ответа нет. Важна аргументация.",
    lockedGauntlet: "Gauntlet закрыт",
    beginGauntlet: "Начать Gauntlet",
    telemetry: "Телеметрия",
    pressureProfile: "Профиль давления",
    personalBadges: "Личные бейджи",
    pace: "Темп",
    readiness: "Готовность",
    result: "Результат сессии",
    selfReview: "Только саморазбор. Без AI-оценки и сравнений."
  }
} satisfies Record<Locale, Record<string, string>>;

export function ModuleConsole({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const ui = uiCopy[locale];
  const [activeModule, setActiveModule] = useState<ModuleId>("reading");
  const [selectedLevel, setSelectedLevel] = useState<ModuleLevel>(2);
  const [screen, setScreen] = useState<ModuleScreen>("setup");
  const [focusMode, setFocusMode] = useState(false);
  const [missedCount, setMissedCount] = useState(1);
  const [writingText, setWritingText] = useState("");
  const [erasures, setErasures] = useState(0);
  const [writingWarning, setWritingWarning] = useState("");
  const [speakingStage, setSpeakingStage] = useState<SpeakingStage>("cold-start");
  const definition = moduleDefinitions[activeModule];

  const activeLevel = useMemo(
    () => definition.levels.find((level) => level.level === selectedLevel) ?? definition.levels[0],
    [definition, selectedLevel]
  );

  const switchModule = (moduleId: ModuleId) => {
    const nextDefinition = moduleDefinitions[moduleId];
    setActiveModule(moduleId);
    setSelectedLevel(nextDefinition.level);
    setScreen("setup");
    setFocusMode(false);
    setWritingWarning("");
    setSpeakingStage("cold-start");
  };

  const selectLevel = (level: ModuleLevel) => {
    const nextLevel = definition.levels.find((option) => option.level === level);
    if (!nextLevel || nextLevel.locked) {
      return;
    }

    setSelectedLevel(level);
    setScreen("setup");
  };

  const startSession = () => {
    if (activeModule === "gauntlet" || activeLevel.locked) {
      setScreen("locked");
      return;
    }

    setScreen("active");
    setFocusMode(false);
  };

  const handleWritingChange = (nextText: string) => {
    if (nextText.length < writingText.length) {
      if (erasures >= 5) {
        setWritingWarning(t.limitHit);
        return;
      }

      setErasures((current) => current + 1);
    }

    setWritingWarning("");
    setWritingText(nextText);
  };

  return (
    <section className="module-console" data-module={activeModule} data-focus={focusMode} aria-labelledby="module-console-title">
      <aside className="module-nav" aria-label={t.moduleNav}>
        <div className="rail-header">
          <span>{t.moduleNav}</span>
          <BadgeCheck size={16} />
        </div>
        {moduleOrder.map((moduleId) => {
          const Icon = moduleIcons[moduleId];
          const moduleDefinition = moduleDefinitions[moduleId];
          return (
            <button
              type="button"
              className="module-nav-item"
              aria-pressed={activeModule === moduleId}
              key={moduleId}
              onClick={() => switchModule(moduleId)}
            >
              <Icon size={18} />
              <span>
                <strong>{moduleDefinition.label}</strong>
                <small>{moduleDefinition.title}</small>
              </span>
              <StatusDot status={moduleDefinition.status} label={ui.status[moduleDefinition.status]} />
            </button>
          );
        })}
      </aside>

      <main className="module-workspace">
        <div className="module-heading">
          <div>
            <p className="micro-label">{definition.label}</p>
            <h2 id="module-console-title">{definition.title}</h2>
            <p>{definition.subtitle}</p>
          </div>
          <LevelChip level={definition.level} label={ui.common.level} />
        </div>

        <div className="module-rulebar">
          <TimerCard label={t.currentRule} value={definition.telemetry.duration} status={definition.telemetry.status} statusLabel={ui.status[definition.telemetry.status]} />
          <div className="rule-chip">
            <ShieldCheck size={16} />
            <span>{definition.telemetry.rule}</span>
          </div>
          <button type="button" className="primary-action" onClick={startSession}>
            <Play size={18} />
            <span>{activeLevel.locked ? t.unavailable : t.start}</span>
          </button>
        </div>

        {screen === "setup" && (
          <LevelSelector
            activeLevel={selectedLevel}
            levels={definition.levels}
            locale={locale}
            onSelect={selectLevel}
          />
        )}

        {activeModule === "reading" && (
          <ReadingModule
            screen={screen}
            focusMode={focusMode}
            locale={locale}
            onFocusToggle={() => setFocusMode((current) => !current)}
            onLock={() => setScreen("locked")}
            onSubmit={() => setScreen("results")}
            onReset={() => setScreen("setup")}
          />
        )}

        {activeModule === "listening" && (
          <ListeningModule
            screen={screen}
            missedCount={missedCount}
            locale={locale}
            onAnswered={() => setScreen("results")}
            onMissed={() => {
              setMissedCount((current) => current + 1);
              setScreen("results");
            }}
            onReset={() => setScreen("setup")}
          />
        )}

        {activeModule === "writing" && (
          <WritingModule
            screen={screen}
            text={writingText}
            erasures={erasures}
            warning={writingWarning}
            locale={locale}
            onChange={handleWritingChange}
            onSubmit={() => setScreen("results")}
            onReset={() => {
              setScreen("setup");
              setWritingText("");
              setErasures(0);
              setWritingWarning("");
            }}
          />
        )}

        {activeModule === "speaking" && (
          <SpeakingModule
            screen={screen}
            stage={speakingStage}
            locale={locale}
            onStageChange={setSpeakingStage}
            onFinish={() => setScreen("results")}
            onReset={() => {
              setScreen("setup");
              setSpeakingStage("cold-start");
            }}
          />
        )}

        {activeModule === "gauntlet" && <GauntletModule locale={locale} />}
      </main>

      <aside className="module-telemetry" aria-label={t.telemetry}>
        <TelemetryPanel definition={definition} locale={locale} />
        <PressurePanel locale={locale} />
        <BadgePanel locale={locale} />
      </aside>
    </section>
  );
}

function LevelSelector({
  levels,
  activeLevel,
  locale,
  onSelect
}: {
  levels: typeof moduleDefinitions.reading.levels;
  activeLevel: ModuleLevel;
  locale: Locale;
  onSelect: (level: ModuleLevel) => void;
}) {
  const t = copy[locale];

  return (
    <article className="level-selector" aria-labelledby="level-selector-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.readiness}</p>
          <h3 id="level-selector-title">{t.chooseLevel}</h3>
        </div>
        <TimerReset size={18} />
      </div>
      <div className="level-grid">
        {levels.map((level) => (
          <button
            type="button"
            className="level-card"
            aria-pressed={activeLevel === level.level}
            disabled={level.locked}
            key={level.name}
            onClick={() => onSelect(level.level)}
          >
            <span className="level-card-topline">
              <LevelChip level={level.level} label={uiCopy[locale].common.level} />
              {level.locked && <LockKeyhole size={16} />}
            </span>
            <strong>{level.name}</strong>
            <small>{level.pressure}</small>
            <span>{level.locked ? `${t.requires}: ${level.requirement}` : level.details.join(" · ")}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function ReadingModule({
  screen,
  focusMode,
  locale,
  onFocusToggle,
  onLock,
  onSubmit,
  onReset
}: {
  screen: ModuleScreen;
  focusMode: boolean;
  locale: Locale;
  onFocusToggle: () => void;
  onLock: () => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const t = copy[locale];
  const locked = screen === "locked";
  const results = screen === "results";

  if (screen === "setup") {
    return null;
  }

  return (
    <div className="module-split">
      <article className="exam-panel reading-panel" aria-labelledby="reading-panel-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{readingPassage.source}</p>
            <h3 id="reading-panel-title">{results ? t.result : readingPassage.title}</h3>
          </div>
          <button type="button" className="secondary-action compact-action" onClick={onFocusToggle}>
            <BookOpenText size={16} />
            <span>{focusMode ? t.exitFocus : t.focus}</span>
          </button>
        </div>
        {locked && (
          <div className="locked-preview">
            <LockKeyhole size={18} />
            <strong>TEXT LOCKED</strong>
            <span>{copy[locale].answerNow}</span>
          </div>
        )}
        {!locked && <p>{readingPassage.excerpt}</p>}
        <div className="note-row">
          <span>{readingPassage.words} {uiCopy[locale].common.words}</span>
          <span>2 minutes visible</span>
          <span>Self-check after submit</span>
        </div>
        {screen === "active" && (
          <button type="button" className="primary-action" onClick={onLock}>
            <LockKeyhole size={18} />
            <span>{t.lockText}</span>
          </button>
        )}
        {results && (
          <div className="result-actions">
            <button type="button" className="secondary-action">
              <BookOpenText size={18} />
              <span>{t.revealText}</span>
            </button>
            <button type="button" className="secondary-action" onClick={onReset}>
              <RotateCcw size={18} />
              <span>{t.repeat}</span>
            </button>
            <button type="button" className="primary-action" onClick={onReset}>
              <ArrowRight size={18} />
              <span>{t.nextPassage}</span>
            </button>
          </div>
        )}
      </article>

      <article className="exam-panel memory-panel" aria-labelledby="memory-title" data-locked={screen === "active"}>
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">Memory check</p>
            <h3 id="memory-title">{screen === "active" ? t.unavailable : t.answerNow}</h3>
          </div>
          {screen === "active" ? <LockKeyhole size={18} /> : <CheckCircle2 size={18} />}
        </div>
        <div className="question-list">
          {readingPassage.questions.map((question, index) => (
            <label className="question-row" key={question}>
              <input type="radio" name={`reading-${index}`} disabled={screen === "active"} />
              <span>{question}</span>
              <StatusDot status={results && index === 1 ? "critical" : "watch"} label={results && index === 1 ? uiCopy[locale].status.critical : uiCopy[locale].status.watch} />
            </label>
          ))}
        </div>
        {locked && (
          <button type="button" className="primary-action" onClick={onSubmit}>
            <CheckCircle2 size={18} />
            <span>{t.submitAnswers}</span>
          </button>
        )}
        {results && <p>{t.selfReview}</p>}
      </article>
    </div>
  );
}

function ListeningModule({
  screen,
  missedCount,
  locale,
  onAnswered,
  onMissed,
  onReset
}: {
  screen: ModuleScreen;
  missedCount: number;
  locale: Locale;
  onAnswered: () => void;
  onMissed: () => void;
  onReset: () => void;
}) {
  const t = copy[locale];

  if (screen === "setup") {
    return null;
  }

  return (
    <div className="module-split">
      <article className="exam-panel audio-panel" aria-labelledby="audio-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{t.track}</p>
            <h3 id="audio-title">{listeningTrack.title}</h3>
          </div>
          <StatusDot status="stable" label={uiCopy[locale].status.stable} />
        </div>
        <div className="audio-strip" aria-label={t.noPause}>
          <AudioLines size={22} />
          <span className="audio-wave" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <strong>{listeningTrack.speed}</strong>
        </div>
        <p>{t.noPause}</p>
        <div className="session-summary">
          <div>
            <dt>Accent</dt>
            <dd>{listeningTrack.accent}</dd>
          </div>
          <div>
            <dt>Missed</dt>
            <dd>{missedCount}</dd>
          </div>
        </div>
      </article>

      <article className="exam-panel" aria-labelledby="listening-question-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{t.answerNow}</p>
            <h3 id="listening-question-title">{listeningTrack.question}</h3>
          </div>
          <TimerCard label="Window" value="00:05" status="critical" statusLabel={uiCopy[locale].status.critical} />
        </div>
        <div className="question-list">
          {listeningTrack.options.map((option) => (
            <label className="question-row" key={option}>
              <input type="radio" name="listening-answer" disabled={screen === "results"} />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {screen === "active" ? (
          <div className="result-actions">
            <button type="button" className="primary-action" onClick={onAnswered}>
              <CheckCircle2 size={18} />
              <span>{t.markAnswered}</span>
            </button>
            <button type="button" className="secondary-action" onClick={onMissed}>
              <AlertTriangle size={18} />
              <span>{t.missedIt}</span>
            </button>
          </div>
        ) : (
          <button type="button" className="secondary-action" onClick={onReset}>
            <RotateCcw size={18} />
            <span>{t.repeat}</span>
          </button>
        )}
      </article>
    </div>
  );
}

function WritingModule({
  screen,
  text,
  erasures,
  warning,
  locale,
  onChange,
  onSubmit,
  onReset
}: {
  screen: ModuleScreen;
  text: string;
  erasures: number;
  warning: string;
  locale: Locale;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const t = copy[locale];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (screen === "setup") {
    return (
      <article className="exam-panel topic-bomb" aria-labelledby="topic-bomb-title">
        <div>
          <p className="micro-label">{t.topicBomb}</p>
          <h3 id="topic-bomb-title">{t.planning}</h3>
        </div>
        <p>{writingTopic}</p>
        <TimerCard label={t.planning} value="00:30" status="critical" statusLabel={uiCopy[locale].status.critical} />
      </article>
    );
  }

  return (
    <div className="module-split writing-split">
      <article className="exam-panel topic-panel" aria-labelledby="writing-topic-title">
        <p className="micro-label">{t.topicBomb}</p>
        <h3 id="writing-topic-title">{writingTopic}</h3>
        <div className="session-summary">
          <div>
            <dt>{t.erasures}</dt>
            <dd>{erasures}/5</dd>
          </div>
          <div>
            <dt>Words</dt>
            <dd>{words}/260</dd>
          </div>
        </div>
        {words < 80 && screen === "active" && <p className="backend-warning">{t.recovery}</p>}
        {screen === "results" && <p>{t.selfReview}</p>}
      </article>

      <article className="exam-panel writing-editor-panel" aria-labelledby="essay-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{t.essay}</p>
            <h3 id="essay-title">No-Delete Mode</h3>
          </div>
          <FileText size={18} />
        </div>
        <textarea
          value={text}
          onChange={(event) => onChange(event.currentTarget.value)}
          readOnly={screen === "results"}
          placeholder="Write your Task 2 essay here..."
        />
        {warning && <p className="backend-warning">{warning}</p>}
        {screen === "active" ? (
          <button type="button" className="primary-action" onClick={onSubmit}>
            <CheckCircle2 size={18} />
            <span>{t.submitEssay}</span>
          </button>
        ) : (
          <button type="button" className="secondary-action" onClick={onReset}>
            <RotateCcw size={18} />
            <span>{t.repeat}</span>
          </button>
        )}
      </article>
    </div>
  );
}

function SpeakingModule({
  screen,
  stage,
  locale,
  onStageChange,
  onFinish,
  onReset
}: {
  screen: ModuleScreen;
  stage: SpeakingStage;
  locale: Locale;
  onStageChange: (stage: SpeakingStage) => void;
  onFinish: () => void;
  onReset: () => void;
}) {
  const t = copy[locale];
  const question = stage === "dilemma" ? speakingQuestions[2] : stage === "part1" ? speakingQuestions[0] : speakingQuestions[1];

  if (screen === "setup") {
    return (
      <article className="exam-panel speaking-prep" aria-labelledby="speaking-prep-title">
        <p className="micro-label">{t.cameraSlot}</p>
        <h3 id="speaking-prep-title">Cold Start</h3>
        <p>Camera opens immediately; preparation exists only to check equipment.</p>
        <TimerCard label="Cold start" value="00:15" status="watch" statusLabel={uiCopy[locale].status.watch} />
      </article>
    );
  }

  return (
    <div className="module-split">
      <article className="exam-panel mirror-panel" aria-labelledby="mirror-title">
        <div className="neutral-face" aria-hidden="true">
          <Camera size={28} />
          <span>{t.neutralFace}</span>
        </div>
        <h3 id="mirror-title">{stage === "post-mortem" || screen === "results" ? t.postMortem : question}</h3>
        <p>{stage === "dilemma" ? t.noRightAnswer : "No nodding, no encouragement, no social rescue."}</p>
        <div className="recording-strip">
          <span />
          <strong>REC</strong>
          <small>webm local draft</small>
        </div>
      </article>

      <article className="exam-panel" aria-labelledby="speaking-controls-title">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{stage === "dilemma" ? t.dilemma : t.answerNow}</p>
            <h3 id="speaking-controls-title">Interview flow</h3>
          </div>
          <Mic2 size={18} />
        </div>
        {screen === "active" ? (
          <div className="result-actions">
            <button type="button" className="secondary-action" onClick={() => onStageChange("part1")}>
              <ArrowRight size={18} />
              <span>Part 1</span>
            </button>
            <button type="button" className="secondary-action" onClick={() => onStageChange("dilemma")}>
              <AlertTriangle size={18} />
              <span>{t.dilemma}</span>
            </button>
            <button type="button" className="primary-action" onClick={onFinish}>
              <Square size={18} />
              <span>{t.endAnswer}</span>
            </button>
          </div>
        ) : (
          <>
            <textarea placeholder="What did you notice about pressure, silence, or topic fear?" />
            <button type="button" className="secondary-action" onClick={onReset}>
              <RotateCcw size={18} />
              <span>{t.repeat}</span>
            </button>
          </>
        )}
      </article>
    </div>
  );
}

function GauntletModule({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <article className="exam-panel gauntlet-lock-panel" aria-labelledby="gauntlet-lock-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.lockedGauntlet}</p>
          <h3 id="gauntlet-lock-title">The Gauntlet</h3>
        </div>
        <LockKeyhole size={20} />
      </div>
      <div className="gauntlet-readiness">
        {skillProgress.map((skill) => (
          <div key={skill.skill}>
            <span>{skill.label}</span>
            <strong>{uiCopy[locale].common.level}{skill.level}</strong>
            <StatusDot status={skill.level === 3 ? "stable" : "locked"} label={skill.level === 3 ? uiCopy[locale].status.stable : uiCopy[locale].status.locked} />
          </div>
        ))}
      </div>
      <p>{moduleDefinitions.gauntlet.requirement}</p>
      <button type="button" className="secondary-action" disabled>
        <LockKeyhole size={18} />
        <span>{t.beginGauntlet}</span>
      </button>
    </article>
  );
}

function TelemetryPanel({ definition, locale }: { definition: typeof moduleDefinitions.reading; locale: Locale }) {
  const t = copy[locale];
  const ui = uiCopy[locale];

  return (
    <article className="module-side-panel" aria-labelledby="telemetry-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.telemetry}</p>
          <h3 id="telemetry-title">{definition.title}</h3>
        </div>
        <StatusDot status={definition.telemetry.status} label={ui.status[definition.telemetry.status]} />
      </div>
      <dl className="session-summary">
        <div>
          <dt>{ui.common.duration}</dt>
          <dd>{definition.telemetry.duration}</dd>
        </div>
        <div>
          <dt>{ui.common.rule}</dt>
          <dd>{definition.telemetry.rule}</dd>
        </div>
        <div>
          <dt>{ui.common.metric}</dt>
          <dd>{definition.telemetry.metric}</dd>
        </div>
        <div>
          <dt>{ui.common.secondary}</dt>
          <dd>{definition.telemetry.secondary}</dd>
        </div>
      </dl>
      <PaceMeter current={definition.telemetry.paceCurrent} target={definition.telemetry.paceTarget} label={t.pace} />
      <div className="module-progress-note">
        <strong>{definition.progress}</strong>
        <span>{definition.requirement}</span>
      </div>
    </article>
  );
}

function PressurePanel({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <article className="module-side-panel" aria-labelledby="pressure-panel-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.pressureProfile}</p>
          <h3 id="pressure-panel-title">Weakest area: Writing</h3>
        </div>
        <AlertTriangle size={18} />
      </div>
      <div className="pressure-axis-list">
        {pressureAxes.map((axis) => (
          <div className="pressure-axis" key={axis.label}>
            <span>
              <axis.icon size={16} />
              {axis.label}
            </span>
            <div className="meter">
              <span style={{ width: `${axis.value * 10}%` }} />
            </div>
            <strong>{axis.value}/10</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function BadgePanel({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <article className="module-side-panel" aria-labelledby="badge-panel-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.personalBadges}</p>
          <h3 id="badge-panel-title">No leaderboard</h3>
        </div>
        <Trophy size={18} />
      </div>
      <div className="badge-list">
        {badges.map((badge) => (
          <div className="badge-row" data-active={badge.active} key={badge.label}>
            <badge.icon size={18} />
            <span>
              <strong>{badge.label}</strong>
              <small>{badge.description}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function TimerCard({ label, value, status, statusLabel }: { label: string; value: string; status: PressureLevel; statusLabel: string }) {
  return (
    <div className="timer-readout module-timer" data-status={status}>
      <TimerReset size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{statusLabel}</em>
    </div>
  );
}

function PaceMeter({ current, target, label }: { current: number; target: number; label: string }) {
  const percent = target ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="module-pace">
      <span>
        <strong>{label}</strong>
        <small>{current}/{target}</small>
      </span>
      <div className="pace-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LevelChip({ level, label }: { level: ModuleLevel; label: string }) {
  return <span className="level-chip">{label}{level}</span>;
}

function StatusDot({ status, label }: { status: PressureLevel; label: string }) {
  return (
    <span className="status-dot" data-status={status}>
      {label}
    </span>
  );
}
