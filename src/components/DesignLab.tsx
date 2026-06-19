"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  ChevronRight,
  Clock3,
  EyeOff,
  Gauge,
  Layers3,
  LogIn,
  LogOut,
  LockKeyhole,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  Trophy,
  UserCircle,
  UserPlus
} from "lucide-react";
import {
  activePassage,
  badges,
  pressureAxes,
  pressureProfile,
  questions,
  sessions,
  skillProgress,
  variants
} from "@/src/data/ielts";
import { designThemes } from "@/src/design/themes";
import { uiCopy } from "@/src/i18n/ui";
import { ModuleConsole } from "@/src/components/ModuleConsole";
import type { PressureLabBackendConfig, SpeakingSession, WritingSession } from "@/src/types/backend";
import type { DesignThemeId, DrillQuestion, Locale, PressureLevel, SkillProgress, SkillType, TrainingSession, VariantId } from "@/src/types";

const localeStorageKey = "ielts-pressure-lab-locale";
const themeStorageKey = "ielts-pressure-lab-theme";
const demoTokenStorageKey = "ielts-pressure-lab-demo-token";

type DrillRunState = "idle" | "running" | "locked" | "submitted";
type AuthMode = "login" | "signup";

const questionsBySkill: Record<SkillType, DrillQuestion[]> = {
  reading: questions,
  listening: [
    { id: "l1", prompt: "Which speaker changes the appointment time?", answerState: "answered" },
    { id: "l2", prompt: "What reason is given for the missing map?", answerState: "unanswered" },
    { id: "l3", prompt: "Which option must be selected without replay?", answerState: "missed" }
  ],
  writing: [
    { id: "w1", prompt: "Does the essay have a clear position in the introduction?", answerState: "answered" },
    { id: "w2", prompt: "Have body paragraphs stayed inside the no-delete limit?", answerState: "unanswered" },
    { id: "w3", prompt: "Is the conclusion a summary, not a new argument?", answerState: "unanswered" }
  ],
  speaking: [
    { id: "s1", prompt: "Did the first answer start within three seconds?", answerState: "missed" },
    { id: "s2", prompt: "Was Part 2 extended without a long pause?", answerState: "unanswered" },
    { id: "s3", prompt: "Did Part 3 include a reason and example?", answerState: "answered" }
  ]
};

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ru";
}

function isDesignTheme(value: string | null): value is DesignThemeId {
  return value === "clinical" || value === "graphite" || value === "bilingual";
}

export function DesignLab() {
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<VariantId>("cockpit");
  const [theme, setTheme] = useState<DesignThemeId>("clinical");
  const [locale, setLocale] = useState<Locale>("en");
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const t = uiCopy[locale];
  const activeVariant = variants.find((option) => option.id === variant) ?? variants[0];
  const activeTheme = designThemes.find((option) => option.id === theme) ?? designThemes[0];
  const mockSignedIn = false;

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    const storedTheme = window.localStorage.getItem(themeStorageKey);

    if (isLocale(storedLocale)) {
      setLocale(storedLocale);
    }

    if (isDesignTheme(storedTheme)) {
      setTheme(storedTheme);
    }

    setMounted(true);
  }, []);

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
  };

  const handleThemeChange = (nextTheme: DesignThemeId) => {
    setTheme(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
  };

  if (!mounted) {
    return (
      <main className="app-shell app-shell-loading" data-variant={variant} data-theme={theme} suppressHydrationWarning>
        <div className="loading-card">
          <div className="brand-mark" aria-hidden="true">
            <Gauge size={20} />
          </div>
          <span>IELTS Pressure Lab</span>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell" data-variant={variant} data-theme={theme} suppressHydrationWarning>
      <header className="topbar" data-locale={locale} aria-label="IELTS Pressure Lab controls">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Gauge size={20} />
          </div>
          <div>
            <p className="micro-label">{t.topbar.designLab}</p>
            <h1>IELTS Pressure Lab</h1>
          </div>
        </div>

        <nav className="variant-switcher" aria-label={t.topbar.variantNav}>
          {variants.map((option) => (
            <button
              type="button"
              key={option.id}
              className="variant-button"
              aria-pressed={variant === option.id}
              onClick={() => setVariant(option.id)}
            >
              <span>{t.variants[option.id].label}</span>
              <small>{t.variants[option.id].description}</small>
            </button>
          ))}
        </nav>

        <div className="control-cluster">
          <nav className="theme-switcher" aria-label={t.topbar.themeNav}>
            {designThemes.map((option) => (
              <button
                type="button"
                key={option.id}
                aria-pressed={theme === option.id}
                aria-label={option.ariaLabel}
                onClick={() => handleThemeChange(option.id)}
                title={`${t.themes[option.id].label}: ${option.colorPair}`}
              >
                <span className="theme-symbol" aria-hidden="true">
                  {option.symbol}
                </span>
                <span className="theme-code">{option.shortCode}</span>
              </button>
            ))}
          </nav>

          <nav className="language-switcher" aria-label={t.topbar.languageNav}>
            {(["en", "ru"] as const).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={locale === option}
                onClick={() => handleLocaleChange(option)}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </nav>

          <div className="topbar-status" aria-label={t.topbar.currentDesign}>
            <SlidersHorizontal size={18} />
            <span>{t.variants[activeVariant.id].label}</span>
            <small>{activeTheme.shortLabel}</small>
          </div>

          <AccountMenu
            isOpen={accountOpen}
            isSignedIn={mockSignedIn}
            locale={locale}
            onToggle={() => setAccountOpen((current) => !current)}
            onAuthSelect={(mode) => {
              setAuthMode(mode);
              setAccountOpen(false);
            }}
          />
        </div>
      </header>

      {variant === "cockpit" && <ModuleConsole locale={locale} />}
      {variant === "map" && <TrainingMap locale={locale} />}
      {variant === "command" && <CommandCenter locale={locale} />}
      {authMode && <AuthPanel locale={locale} mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} />}
    </main>
  );
}

function AccountMenu({
  isOpen,
  isSignedIn,
  locale,
  onToggle,
  onAuthSelect
}: {
  isOpen: boolean;
  isSignedIn: boolean;
  locale: Locale;
  onToggle: () => void;
  onAuthSelect: (mode: AuthMode) => void;
}) {
  const t = uiCopy[locale];

  return (
    <div className="account-menu">
      <button
        type="button"
        className="account-trigger"
        aria-label={t.account.menuLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <UserCircle size={20} />
      </button>

      {isOpen && (
        <div className="account-popover" role="menu" aria-label={t.account.menuLabel}>
          <div className="account-summary">
            <UserCircle size={22} />
            <span>
              <strong>{isSignedIn ? t.account.signedInAs : t.account.guestMode}</strong>
              <small>{isSignedIn ? "student@ielts.lab" : "IELTS Pressure Lab"}</small>
            </span>
          </div>

          {isSignedIn ? (
            <>
              <button type="button" role="menuitem">
                <UserCircle size={17} />
                <span>{t.account.profile}</span>
              </button>
              <button type="button" role="menuitem">
                <LogOut size={17} />
                <span>{t.account.logout}</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" role="menuitem" onClick={() => onAuthSelect("login")}>
                <LogIn size={17} />
                <span>{t.account.login}</span>
              </button>
              <button type="button" role="menuitem" onClick={() => onAuthSelect("signup")}>
                <UserPlus size={17} />
                <span>{t.account.signUp}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AuthPanel({
  locale,
  mode,
  onModeChange,
  onClose
}: {
  locale: Locale;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const t = uiCopy[locale];
  const isSignup = mode === "signup";

  return (
    <div className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-panel-title">
      <div className="auth-card">
        <div className="panel-toolbar">
          <div>
            <p className="micro-label">{t.account.accessLabel}</p>
            <h2 id="auth-panel-title">{isSignup ? t.account.signUpTitle : t.account.loginTitle}</h2>
          </div>
          <button type="button" className="icon-action" onClick={onClose} aria-label={t.account.close}>
            ×
          </button>
        </div>
        <p>{isSignup ? t.account.signUpDescription : t.account.loginDescription}</p>

        <form className="auth-form">
          {isSignup && (
            <label>
              <span>{t.account.name}</span>
              <input type="text" name="name" autoComplete="name" placeholder="Student name" />
            </label>
          )}
          <label>
            <span>{t.account.email}</span>
            <input type="email" name="email" autoComplete="email" placeholder="student@example.com" />
          </label>
          <label>
            <span>{t.account.password}</span>
            <input type="password" name="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder="••••••••" />
          </label>
          <button type="button" className="primary-action">
            <span>{isSignup ? t.account.signUp : t.account.login}</span>
          </button>
        </form>

        <button type="button" className="text-action auth-mode-toggle" onClick={() => onModeChange(isSignup ? "login" : "signup")}>
          <span>{isSignup ? t.account.hasAccount : t.account.needsAccount}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function DrillCockpit({ locale }: { locale: Locale }) {
  const t = uiCopy[locale];
  const [selectedSkill, setSelectedSkill] = useState<SkillType>("reading");
  const activeSession = sessions.find((session) => session.skill === selectedSkill) ?? sessions[0];
  const selectedProgress = skillProgress.find((skill) => skill.skill === selectedSkill) ?? skillProgress[0];
  const [runState, setRunState] = useState<DrillRunState>("idle");
  const isReading = selectedSkill === "reading";
  const visibleQuestions = questionsBySkill[selectedSkill];
  const passageHidden = isReading && (runState === "locked" || runState === "submitted");
  const actionLabel =
    runState === "idle"
      ? t.cockpit.startDrill
      : runState === "running"
        ? t.cockpit.lockPassage
        : runState === "locked"
          ? t.cockpit.submitAnswers
          : t.cockpit.resetRun;

  const handleRunAction = () => {
    setRunState((current) => {
      if (current === "idle") {
        return "running";
      }

      if (current === "running") {
        return "locked";
      }

      if (current === "locked") {
        return "submitted";
      }

      return "idle";
    });
  };

  useEffect(() => {
    setRunState("idle");
  }, [selectedSkill]);

  return (
    <section className="variant-stage cockpit-layout" data-run-state={runState} aria-labelledby="cockpit-title">
      <aside className="skill-rail" aria-label="IELTS modules">
        <div className="rail-header">
          <span>{t.common.modules}</span>
          <BadgeCheck size={16} />
        </div>
        {skillProgress.map((skill) => (
          <button type="button" className="rail-item" aria-pressed={skill.skill === selectedSkill} key={skill.skill} onClick={() => setSelectedSkill(skill.skill)}>
            <skill.icon size={18} />
            <span>{skill.label}</span>
            <LevelChip level={skill.level} locale={locale} />
          </button>
        ))}
      </aside>

      <div className="drill-workspace">
        <div className="section-heading">
          <div>
            <p className="micro-label">{t.cockpit.activeDrill}</p>
            <h2 id="cockpit-title">{activeSession.title}</h2>
          </div>
          <LevelChip level={activeSession.level} locale={locale} />
        </div>

        <div className="timer-strip" role="group" aria-label={`${selectedProgress.label} drill timing`}>
          <TimerReadout label={isReading ? t.cockpit.passageLocksIn : t.cockpit.constraintStartsIn} value={isReading ? activePassage.timer : activeSession.duration} tone="watch" locale={locale} />
          <div className="rule-chip">
            <EyeOff size={16} />
            <span>{activeSession.pressureRule}</span>
          </div>
          <button type="button" className="primary-action" onClick={handleRunAction}>
            <Play size={18} />
            <span>{actionLabel}</span>
          </button>
        </div>

        <div className="run-state-strip" role="status" aria-live="polite">
          <span>{t.cockpit.sessionStateLabel}</span>
          <strong>{t.cockpit.runState[runState]}</strong>
        </div>

        <div className="practice-grid">
          {isReading ? (
            <article className="passage-panel" aria-labelledby="passage-title">
            <div className="panel-toolbar">
              <div>
                <p className="micro-label">{activePassage.source}</p>
                <h3 id="passage-title">{activePassage.title}</h3>
              </div>
              <span className="word-count">
                {activePassage.words} {t.common.words}
              </span>
            </div>
            {passageHidden ? (
              <div className="locked-preview" aria-label={t.cockpit.lockedPreviewLabel}>
                <LockKeyhole size={18} />
                <strong>{activePassage.lockedPreview}</strong>
                <span>{runState === "submitted" ? t.cockpit.runState.submitted : t.cockpit.passageReturns}</span>
              </div>
            ) : (
              <p>{activePassage.excerpt}</p>
            )}
            <div className="note-row">
              {activePassage.notes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
          </article>
          ) : (
            <article className="passage-panel module-preview-panel" aria-labelledby="module-preview-title">
              <div className="panel-toolbar">
                <div>
                  <p className="micro-label">{selectedProgress.label}</p>
                  <h3 id="module-preview-title">{activeSession.mode}</h3>
                </div>
                <StatusDot status={activeSession.status} locale={locale} />
              </div>
              <p>{activeSession.pressureRule}</p>
              <div className="session-summary">
                <div>
                  <dt>{t.common.metric}</dt>
                  <dd>{activeSession.primaryMetric}</dd>
                </div>
                <div>
                  <dt>{t.common.secondary}</dt>
                  <dd>{activeSession.secondaryMetric}</dd>
                </div>
              </div>
              <button type="button" className="secondary-action" onClick={() => setRunState("running")}>
                <span>{t.cockpit.openModule}</span>
                <ArrowRight size={18} />
              </button>
            </article>
          )}

          <article className="question-panel" aria-labelledby="question-title">
            <div className="panel-toolbar">
              <div>
                <p className="micro-label">{t.cockpit.memoryCheck}</p>
                <h3 id="question-title">{t.cockpit.questionsFromMemory}</h3>
              </div>
              <span className="status-pill" data-status="watch">
                3 {t.common.items}
              </span>
            </div>
            <div className="question-list">
              {visibleQuestions.map((question) => (
                <label className="question-row" key={question.id}>
                  <input type="checkbox" defaultChecked={question.answerState === "answered"} />
                  <span>{question.prompt}</span>
                  <QuestionState state={question.answerState} locale={locale} />
                </label>
              ))}
            </div>
            <button type="button" className="secondary-action">
              <BookOpenCheck size={18} />
              <span>{t.cockpit.submitAnswers}</span>
            </button>
          </article>
        </div>
      </div>

      <aside className="telemetry-drawer" aria-label="Session telemetry">
        <SessionTelemetry session={activeSession} locale={locale} />
        <PaceBar current={186} target={200} locale={locale} />
        <PressureProfilePanel compact locale={locale} />
      </aside>
    </section>
  );
}

function TrainingMap({ locale }: { locale: Locale }) {
  const t = uiCopy[locale];
  const [selectedSkillId, setSelectedSkillId] = useState<SkillType>("reading");
  const gauntletReady = skillProgress.every((skill) => skill.level === 3);
  const selectedSkill = skillProgress.find((skill) => skill.skill === selectedSkillId) ?? skillProgress[0];
  const selectedSession = sessions.find((session) => session.skill === selectedSkill.skill) ?? sessions[0];

  return (
    <section className="variant-stage map-layout" aria-labelledby="map-title">
      <div className="map-main">
        <div className="section-heading">
          <div>
            <p className="micro-label">{t.map.planLabel}</p>
            <h2 id="map-title">{t.map.title}</h2>
          </div>
          <button type="button" className="primary-action">
            <TimerReset size={18} />
            <span>{t.map.queueNextSession}</span>
          </button>
        </div>

        <div className="skill-map" aria-label="Skill progression lanes">
          {skillProgress.map((skill) => (
            <SkillLane
              key={skill.skill}
              skill={skill}
              locale={locale}
              selected={skill.skill === selectedSkillId}
              onSelect={() => setSelectedSkillId(skill.skill)}
            />
          ))}
        </div>

        <article className="lane-detail-panel" aria-labelledby="lane-detail-title">
          <div className="panel-toolbar">
            <div>
              <p className="micro-label">{selectedSkill.label}</p>
              <h3 id="lane-detail-title">{selectedSession.title}</h3>
            </div>
            <StatusDot status={selectedSession.status} locale={locale} />
          </div>
          <SessionSummary session={selectedSession} locale={locale} />
        </article>

        <div className="gauntlet-panel" data-ready={gauntletReady}>
          <div className="gauntlet-icon" aria-hidden="true">
            {gauntletReady ? <Trophy size={22} /> : <LockKeyhole size={22} />}
          </div>
          <div>
            <p className="micro-label">{t.map.gauntletLabel}</p>
            <h3>{gauntletReady ? t.map.gauntletReady : t.map.gauntletLocked}</h3>
            <p>{t.map.gauntletDescription}</p>
          </div>
          <button type="button" className="secondary-action" disabled={!gauntletReady}>
            <span>{gauntletReady ? t.map.startGauntlet : t.map.unlockLevel3}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <aside className="map-side" aria-label="Profile and achievements">
        <PressureProfilePanel locale={locale} />
        <div className="badge-panel">
          <div className="panel-toolbar">
            <div>
              <p className="micro-label">{t.map.personalBadges}</p>
              <h3>{t.map.noLeaderboard}</h3>
            </div>
            <ShieldCheck size={18} />
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
        </div>
      </aside>
    </section>
  );
}

function CommandCenter({ locale }: { locale: Locale }) {
  const t = uiCopy[locale];
  const recommendedSession = sessions.find((session) => session.skill === pressureProfile.weakestArea) ?? sessions[2];
  const [selectedSessionId, setSelectedSessionId] = useState(recommendedSession.id);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? recommendedSession;
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => Number(b.status === "critical") - Number(a.status === "critical")),
    []
  );

  return (
    <section className="variant-stage command-layout" aria-labelledby="command-title">
      <div className="command-hero">
        <div>
          <p className="micro-label">{t.command.label}</p>
          <h2 id="command-title">{t.command.title}</h2>
          <p>{t.command.description}</p>
        </div>
        <TimerReadout label={t.command.nextSectionStartsIn} value="02:00" tone="stable" locale={locale} />
      </div>

      <div className="command-grid">
        <article className="recommendation-panel" aria-labelledby="recommend-title">
          <div className="panel-toolbar">
            <div>
              <p className="micro-label">{t.command.recommendedDrill}</p>
              <h3 id="recommend-title">{selectedSession.title}</h3>
            </div>
            <StatusDot status={selectedSession.status} locale={locale} />
          </div>
          <SessionSummary session={selectedSession} locale={locale} />
          <button type="button" className="primary-action">
            <Play size={18} />
            <span>{t.command.beginPressureRun}</span>
          </button>
        </article>

        <PressureProfilePanel locale={locale} />

        <article className="session-list-panel" aria-labelledby="session-list-title">
          <div className="panel-toolbar">
            <div>
              <p className="micro-label">{t.command.sessionQueue}</p>
              <h3 id="session-list-title">{t.command.todaysConstraints}</h3>
            </div>
            <Layers3 size={18} />
          </div>
          <div className="compact-session-list">
            {sortedSessions.map((session) => (
              <SessionQueueItem
                key={session.id}
                session={session}
                locale={locale}
                selected={session.id === selectedSessionId}
                onSelect={() => setSelectedSessionId(session.id)}
              />
            ))}
          </div>
        </article>

        <article className="progress-panel" aria-labelledby="progress-title">
          <div className="panel-toolbar">
            <div>
              <p className="micro-label">{t.command.skillReadiness}</p>
              <h3 id="progress-title">{t.command.levelGates}</h3>
            </div>
            <BarChart3 size={18} />
          </div>
          <div className="readiness-grid">
            {skillProgress.map((skill) => (
              <MiniProgress key={skill.skill} skill={skill} />
            ))}
          </div>
        </article>

        <BackendToolsPanel locale={locale} />
      </div>
    </section>
  );
}

function BackendToolsPanel({ locale }: { locale: Locale }) {
  const t = uiCopy[locale];
  const [config, setConfig] = useState<PressureLabBackendConfig | null>(null);
  const [writingSession, setWritingSession] = useState<WritingSession | null>(null);
  const [speakingSession, setSpeakingSession] = useState<SpeakingSession | null>(null);
  const [busyAction, setBusyAction] = useState<"writing" | "speaking" | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    fetch("/api/pressure-lab/config")
      .then((response) => response.json())
      .then((payload: { config: PressureLabBackendConfig }) => {
        if (mounted) {
          setConfig(payload.config);
        }
      })
      .catch(() => {
        if (mounted) {
          setConfig(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getDemoToken = async () => {
    const storedToken = window.localStorage.getItem(demoTokenStorageKey);
    if (storedToken) {
      return storedToken;
    }

    const credentials = {
      email: "demo@ielts-pressure.lab",
      password: "PressureLabDemo1",
      name: "Demo Student"
    };
    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    const authResponse = registerResponse.ok
      ? registerResponse
      : await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password })
        });
    const payload = (await authResponse.json()) as { token?: string; error?: string };

    if (!payload.token) {
      throw new Error(payload.error ?? "Demo auth failed");
    }

    window.localStorage.setItem(demoTokenStorageKey, payload.token);
    return payload.token;
  };

  const demoFetch = async (path: string, init: RequestInit) => {
    const send = async (token: string) =>
      fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...init.headers
        }
      });

    const firstToken = await getDemoToken();
    const firstResponse = await send(firstToken);

    if (firstResponse.status !== 401) {
      return firstResponse;
    }

    window.localStorage.removeItem(demoTokenStorageKey);
    const freshToken = await getDemoToken();
    return send(freshToken);
  };

  const createWriting = async () => {
    setBusyAction("writing");
    setApiStatus("");
    try {
      const response = await demoFetch("/api/writing/sessions", {
        method: "POST",
        body: JSON.stringify({})
      });

      const payload = (await response.json()) as { session?: WritingSession; error?: string };
      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "Writing API returned an error");
      }

      setWritingSession(payload.session);
      setApiStatus(`Writing session created: ${payload.session.id.slice(0, 8)}`);
    } catch (error) {
      setApiStatus(error instanceof Error ? error.message : "Writing API request failed");
    } finally {
      setBusyAction(null);
    }
  };

  const createSpeaking = async () => {
    setBusyAction("speaking");
    setApiStatus("");
    try {
      const response = await demoFetch("/api/speaking/sessions", {
        method: "POST",
        body: JSON.stringify({ level: 1, parts: ["part1", "part2", "part3"] })
      });

      const payload = (await response.json()) as { session?: SpeakingSession; error?: string };
      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "Speaking API returned an error");
      }

      setSpeakingSession(payload.session);
      setApiStatus(`Speaking session created: ${payload.session.id.slice(0, 8)}`);
    } catch (error) {
      setApiStatus(error instanceof Error ? error.message : "Speaking API request failed");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="backend-panel" aria-labelledby="backend-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.backendTools.label}</p>
          <h3 id="backend-title">{t.backendTools.title}</h3>
        </div>
        <ShieldCheck size={18} />
      </div>
      <p>{t.backendTools.description}</p>
      {apiStatus && <p className="backend-warning">{apiStatus}</p>}

      <div className="backend-action-grid">
        <div className="backend-session-card">
          <strong>{t.backendTools.writing}</strong>
          <small>
            {config
              ? `${config.writing.erasuresLimit} ${t.backendTools.erasures} · ${config.writing.targetWords} ${t.backendTools.target}`
              : t.backendTools.noSession}
          </small>
          <span>{writingSession ? `${t.backendTools.activeSession}: ${writingSession.id.slice(0, 8)}` : t.backendTools.noSession}</span>
          <button type="button" className="secondary-action" onClick={createWriting} disabled={busyAction === "writing"}>
            <span>{t.backendTools.createWriting}</span>
          </button>
        </div>

        <div className="backend-session-card">
          <strong>{t.backendTools.speaking}</strong>
          <small>
            {config
              ? `${config.speaking.coldStartSeconds}s ${t.backendTools.coldStart} · ${speakingSession?.questions.length ?? 5} ${t.backendTools.questions}`
              : t.backendTools.noSession}
          </small>
          <span>{speakingSession ? `${t.backendTools.activeSession}: ${speakingSession.id.slice(0, 8)}` : t.backendTools.noSession}</span>
          <button type="button" className="secondary-action" onClick={createSpeaking} disabled={busyAction === "speaking"}>
            <span>{t.backendTools.createSpeaking}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function TimerReadout({ label, value, tone, locale }: { label: string; value: string; tone: PressureLevel; locale: Locale }) {
  const t = uiCopy[locale];

  return (
    <div className="timer-readout" data-status={tone}>
      <Clock3 size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{t.status[tone]}</em>
    </div>
  );
}

function LevelChip({ level, locale }: { level: 1 | 2 | 3; locale: Locale }) {
  const t = uiCopy[locale];

  return <span className="level-chip">{t.common.level}{level}</span>;
}

function StatusDot({ status, locale }: { status: PressureLevel; locale: Locale }) {
  const t = uiCopy[locale];

  return (
    <span className="status-dot" data-status={status}>
      {t.status[status]}
    </span>
  );
}

function QuestionState({ state, locale }: { state: "unanswered" | "answered" | "missed"; locale: Locale }) {
  const t = uiCopy[locale];
  const label = state === "answered" ? t.questionState.answered : state === "missed" ? t.questionState.missed : t.questionState.open;

  return (
    <span className="question-state" data-state={state}>
      {label}
    </span>
  );
}

function PaceBar({ current, target, locale }: { current: number; target: number; locale: Locale }) {
  const t = uiCopy[locale];
  const percent = Math.min((current / target) * 100, 120);

  return (
    <article className="pace-panel" aria-labelledby="pace-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.cockpit.pace}</p>
          <h3 id="pace-title">{current} wpm</h3>
        </div>
        <span>{target} {t.common.target}</span>
      </div>
      <div className="pace-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>{t.cockpit.paceNote}</p>
    </article>
  );
}

function PressureProfilePanel({ compact = false, locale }: { compact?: boolean; locale: Locale }) {
  const t = uiCopy[locale];

  return (
    <article className={compact ? "profile-panel profile-panel-compact" : "profile-panel"} aria-labelledby="profile-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.profile.pressureProfile}</p>
          <h3 id="profile-title">{t.profile.weakestAreaWriting}</h3>
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
            <div className="meter" aria-label={`${axis.label} ${axis.value} ${t.profile.outOfTen}`}>
              <span style={{ width: `${axis.value * 10}%` }} />
            </div>
            <strong>{axis.value}/10</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function SkillLane({
  skill,
  locale,
  selected,
  onSelect
}: {
  skill: SkillProgress;
  locale: Locale;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = uiCopy[locale];
  const completion = Math.min((skill.sessionsCompleted / skill.targetSessions) * 100, 100);

  return (
    <article className="skill-lane" data-status={skill.status} data-selected={selected}>
      <div className="lane-topline">
        <div className="lane-title">
          <skill.icon size={20} />
          <strong>{skill.label}</strong>
        </div>
        <LevelChip level={skill.level} locale={locale} />
      </div>
      <div className="lane-progress" aria-label={`${skill.label} ${skill.sessionsCompleted} of ${skill.targetSessions} sessions`}>
        <span style={{ width: `${completion}%` }} />
      </div>
      <div className="lane-meta">
        <span>{skill.sessionsCompleted}/{skill.targetSessions} sessions</span>
        <StatusDot status={skill.status} locale={locale} />
      </div>
      <p>{skill.nextUnlock}</p>
      <button type="button" className="text-action" aria-pressed={selected} onClick={onSelect}>
        <span>{t.common.openLane}</span>
        <ChevronRight size={16} />
      </button>
    </article>
  );
}

function SessionTelemetry({ session, locale }: { session: TrainingSession; locale: Locale }) {
  const t = uiCopy[locale];

  return (
    <article className="session-telemetry" aria-labelledby="telemetry-title">
      <div className="panel-toolbar">
        <div>
          <p className="micro-label">{t.cockpit.telemetry}</p>
          <h3 id="telemetry-title">{session.mode}</h3>
        </div>
        <StatusDot status={session.status} locale={locale} />
      </div>
      <SessionSummary session={session} locale={locale} />
    </article>
  );
}

function SessionSummary({ session, locale }: { session: TrainingSession; locale: Locale }) {
  const t = uiCopy[locale];

  return (
    <dl className="session-summary">
      <div>
        <dt>{t.common.duration}</dt>
        <dd>{session.duration}</dd>
      </div>
      <div>
        <dt>{t.common.rule}</dt>
        <dd>{session.pressureRule}</dd>
      </div>
      <div>
        <dt>{t.common.metric}</dt>
        <dd>{session.primaryMetric}</dd>
      </div>
      <div>
        <dt>{t.common.secondary}</dt>
        <dd>{session.secondaryMetric}</dd>
      </div>
    </dl>
  );
}

function SessionQueueItem({
  session,
  locale,
  selected,
  onSelect
}: {
  session: TrainingSession;
  locale: Locale;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className="queue-item" aria-pressed={selected} onClick={onSelect}>
      <span>
        <strong>{session.title}</strong>
        <small>{session.pressureRule}</small>
      </span>
      <StatusDot status={session.status} locale={locale} />
    </button>
  );
}

function MiniProgress({ skill }: { skill: SkillProgress }) {
  const completion = Math.min((skill.sessionsCompleted / skill.targetSessions) * 100, 100);

  return (
    <div className="mini-progress">
      <div>
        <skill.icon size={16} />
        <strong>{skill.label}</strong>
      </div>
      <span className="mini-track" aria-hidden="true">
        <span style={{ width: `${completion}%` }} />
      </span>
      <small>{skill.metric}</small>
    </div>
  );
}
