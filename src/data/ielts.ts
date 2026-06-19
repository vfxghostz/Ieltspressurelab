import {
  AudioLines,
  BookOpenText,
  Flame,
  Headphones,
  LockKeyhole,
  Mic2,
  PenLine,
  RadioTower,
  Timer,
  Trophy
} from "lucide-react";
import type { DrillQuestion, PressureProfile, SkillProgress, TrainingSession, VariantOption } from "@/src/types";

export const variants: VariantOption[] = [
  {
    id: "cockpit",
    label: "Module Console",
    description: "Full Reading, Listening, Writing, Speaking, and Gauntlet pressure-workflow console."
  },
  {
    id: "map",
    label: "Training Map",
    description: "Adaptive skill lanes, unlock logic, personal badges, and Gauntlet readiness."
  },
  {
    id: "command",
    label: "Command Center",
    description: "Dashboard overview combining next session, profile, and pressure telemetry."
  }
];

export const pressureProfile: PressureProfile = {
  timerAnxiety: 8,
  topicAnxiety: 6,
  socialAnxiety: 7,
  perfectionism: 9,
  weakestArea: "writing"
};

export const skillProgress: SkillProgress[] = [
  {
    skill: "reading",
    label: "Reading",
    level: 2,
    sessionsCompleted: 4,
    targetSessions: 5,
    status: "watch",
    metric: "186 wpm",
    delta: "+14 from baseline",
    nextUnlock: "75% accuracy at 200 wpm",
    icon: BookOpenText
  },
  {
    skill: "listening",
    label: "Listening",
    level: 2,
    sessionsCompleted: 3,
    targetSessions: 5,
    status: "stable",
    metric: "1 missed",
    delta: "No rewind active",
    nextUnlock: "Five sessions with <=1 missed",
    icon: Headphones
  },
  {
    skill: "writing",
    label: "Writing",
    level: 1,
    sessionsCompleted: 2,
    targetSessions: 3,
    status: "critical",
    metric: "5 erasures",
    delta: "Pace drops after minute 18",
    nextUnlock: "Complete structure x3",
    icon: PenLine
  },
  {
    skill: "speaking",
    label: "Speaking",
    level: 1,
    sessionsCompleted: 1,
    targetSessions: 3,
    status: "watch",
    metric: "4.2s pause",
    delta: "Cold start pending",
    nextUnlock: "First answer pause under 3s",
    icon: Mic2
  }
];

export const sessions: TrainingSession[] = [
  {
    id: "sprint-lock",
    skill: "reading",
    title: "Sprint & Lock",
    mode: "Passage memory drill",
    level: 2,
    duration: "02:00 read + 08:00 recall",
    pressureRule: "Text disappears when the timer reaches zero.",
    primaryMetric: "186 wpm",
    secondaryMetric: "Target 200 wpm",
    status: "watch"
  },
  {
    id: "one-shot",
    skill: "listening",
    title: "One Shot",
    mode: "No rewind listening",
    level: 2,
    duration: "11:30 audio",
    pressureRule: "Pause and rewind are disabled after playback starts.",
    primaryMetric: "1 missed answer",
    secondaryMetric: "1.1x speed",
    status: "stable"
  },
  {
    id: "forge",
    skill: "writing",
    title: "The Forge",
    mode: "No-delete Task 2",
    level: 1,
    duration: "40:00 essay",
    pressureRule: "Only five deletions are allowed in the session.",
    primaryMetric: "142 words",
    secondaryMetric: "6.1 wpm",
    status: "critical"
  },
  {
    id: "mirror",
    skill: "speaking",
    title: "The Mirror",
    mode: "Cold-start interview",
    level: 1,
    duration: "15s start",
    pressureRule: "Camera opens immediately; the first question follows.",
    primaryMetric: "Part 3 dilemmas",
    secondaryMetric: "Neutral face",
    status: "watch"
  }
];

export const activePassage = {
  title: "Urban Heat Islands",
  source: "Academic Reading Passage 2",
  timer: "01:42",
  lockedPreview: "TEXT LOCKED",
  words: 372,
  excerpt:
    "Cities retain heat through asphalt, concrete, and dense building geometry. Researchers now measure not only average temperature but the speed at which neighbourhoods cool after sunset, because delayed cooling changes sleep, transport behaviour, and public health risk.",
  notes: ["2 minutes visible", "Memory questions open after lock", "Self-check reveals passage only after submit"]
};

export const questions: DrillQuestion[] = [
  { id: "q1", prompt: "Which factor delays night-time cooling in dense cities?", answerState: "answered" },
  { id: "q2", prompt: "What measurement did researchers add beyond average temperature?", answerState: "unanswered" },
  { id: "q3", prompt: "Which public behaviour is mentioned as affected by heat retention?", answerState: "missed" }
];

export const pressureAxes = [
  { label: "Timer Anxiety", value: pressureProfile.timerAnxiety, icon: Timer },
  { label: "Topic Anxiety", value: pressureProfile.topicAnxiety, icon: RadioTower },
  { label: "Social Anxiety", value: pressureProfile.socialAnxiety, icon: AudioLines },
  { label: "Perfectionism", value: pressureProfile.perfectionism, icon: Flame }
];

export const badges = [
  { label: "Iron Pen", description: "3 no-delete essays", active: false, icon: PenLine },
  { label: "Cold Blood", description: "Pause under 3 seconds", active: false, icon: Mic2 },
  { label: "Pace Badge", description: "5 one-shot sessions", active: true, icon: Trophy },
  { label: "Gauntlet", description: "All Level 3 required", active: false, icon: LockKeyhole }
];
