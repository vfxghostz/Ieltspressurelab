import type { PressureLevel, SkillType } from "@/src/types";

export type ModuleId = SkillType | "gauntlet";
export type ModuleLevel = 1 | 2 | 3;

export interface ModuleLevelOption {
  level: ModuleLevel;
  name: string;
  pressure: string;
  details: string[];
  locked?: boolean;
  requirement?: string;
}

export interface ModuleTelemetry {
  duration: string;
  rule: string;
  metric: string;
  secondary: string;
  paceCurrent: number;
  paceTarget: number;
  status: PressureLevel;
}

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  title: string;
  subtitle: string;
  level: ModuleLevel;
  status: PressureLevel;
  progress: string;
  requirement: string;
  telemetry: ModuleTelemetry;
  levels: ModuleLevelOption[];
}

export const moduleOrder: ModuleId[] = ["reading", "listening", "writing", "speaking", "gauntlet"];

export const moduleDefinitions: Record<ModuleId, ModuleDefinition> = {
  reading: {
    id: "reading",
    label: "Reading",
    title: "Sprint & Lock",
    subtitle: "Read while visible, answer only after the passage disappears.",
    level: 2,
    status: "watch",
    progress: "4/5 sessions to Level 3",
    requirement: "75% accuracy at 200 wpm",
    telemetry: {
      duration: "02:00 read + 08:00 recall",
      rule: "Text disappears when the countdown reaches zero.",
      metric: "186 wpm",
      secondary: "Target 200 wpm",
      paceCurrent: 186,
      paceTarget: 200,
      status: "watch"
    },
    levels: [
      {
        level: 1,
        name: "Warm-up",
        pressure: "Text visible",
        details: ["Timer visible", "Questions available after reading", "Pause allowed"]
      },
      {
        level: 2,
        name: "Sprint",
        pressure: "Text disappears after 2 minutes",
        details: ["Timer visible", "Questions locked first", "Memory recall after lock"]
      },
      {
        level: 3,
        name: "Exam Mode",
        pressure: "Hidden timer + sound cue",
        details: ["No visible timer", "30s sound warning", "Self-check after submit"],
        locked: true,
        requirement: "5 Level 2 sessions with accuracy ≥75%"
      }
    ]
  },
  listening: {
    id: "listening",
    label: "Listening",
    title: "One Shot",
    subtitle: "Audio keeps moving. No pause, no rewind, no second chance.",
    level: 2,
    status: "stable",
    progress: "3/5 sessions to Level 3",
    requirement: "Five sessions with ≤1 missed answer",
    telemetry: {
      duration: "11:30 audio",
      rule: "Pause and rewind are disabled after playback starts.",
      metric: "1 missed",
      secondary: "1.1× speed",
      paceCurrent: 1,
      paceTarget: 1,
      status: "stable"
    },
    levels: [
      {
        level: 1,
        name: "Guided",
        pressure: "Audio can be paused",
        details: ["Visible track list", "Question preview", "Replay after submit"]
      },
      {
        level: 2,
        name: "One Shot",
        pressure: "No rewind once started",
        details: ["Question appears during audio", "5s missed window", "Audio never stops"]
      },
      {
        level: 3,
        name: "Speed Dial",
        pressure: "1.2× playback + no pause",
        details: ["Hidden progress", "No question preview", "Missed counter only"],
        locked: true,
        requirement: "5 sessions with no more than one missed answer"
      }
    ]
  },
  writing: {
    id: "writing",
    label: "Writing",
    title: "The Forge",
    subtitle: "Topic bomb, short planning window, and a hard no-delete limit.",
    level: 1,
    status: "critical",
    progress: "2/3 essays to Level 2",
    requirement: "Complete structure ×3",
    telemetry: {
      duration: "00:30 plan + 40:00 essay",
      rule: "Only five deletion attempts are allowed.",
      metric: "142 words",
      secondary: "Target 260 words",
      paceCurrent: 142,
      paceTarget: 260,
      status: "critical"
    },
    levels: [
      {
        level: 1,
        name: "Topic Bomb",
        pressure: "Topic appears after 3 seconds",
        details: ["30s planning", "Visible word target", "Structure checklist"]
      },
      {
        level: 2,
        name: "No-Delete",
        pressure: "Five erasures maximum",
        details: ["Deletion counter", "Pace tracker", "Recovery mode when behind"]
      },
      {
        level: 3,
        name: "Full Task 2",
        pressure: "No helper prompts",
        details: ["No delete", "Hidden structure hints", "Final self-review only"],
        locked: true,
        requirement: "3 complete essays with intro, body, conclusion"
      }
    ]
  },
  speaking: {
    id: "speaking",
    label: "Speaking",
    title: "The Mirror",
    subtitle: "Cold-start interview with neutral feedback and dilemma questions.",
    level: 1,
    status: "watch",
    progress: "1/3 sessions to Level 2",
    requirement: "First answer pause under 3 seconds",
    telemetry: {
      duration: "15s cold start + interview",
      rule: "Camera opens immediately; first question follows automatically.",
      metric: "4.2s pause",
      secondary: "Target <3s",
      paceCurrent: 42,
      paceTarget: 30,
      status: "watch"
    },
    levels: [
      {
        level: 1,
        name: "Cold Start",
        pressure: "15 seconds to settle",
        details: ["Camera slot opens", "Question appears automatically", "Recording from second one"]
      },
      {
        level: 2,
        name: "Neutral Face",
        pressure: "No examiner encouragement",
        details: ["No nodding", "Follow-up after silence", "Part 2 extension"]
      },
      {
        level: 3,
        name: "Dilemma",
        pressure: "Part 3 impossible choices",
        details: ["No right answer", "Reasoning matters", "Post-mortem only"],
        locked: true,
        requirement: "Complete cold-start and neutral-face drills"
      }
    ]
  },
  gauntlet: {
    id: "gauntlet",
    label: "Gauntlet",
    title: "Full Exam Simulation",
    subtitle: "Four Level 3 sections back-to-back with only controlled transitions.",
    level: 3,
    status: "locked",
    progress: "Locked until all modules reach Level 3",
    requirement: "Reading, Listening, Writing, Speaking must all be Level 3",
    telemetry: {
      duration: "Full exam flow",
      rule: "No exit, no pause, no skipped sections.",
      metric: "0/4 sections ready",
      secondary: "2-minute transitions",
      paceCurrent: 0,
      paceTarget: 4,
      status: "locked"
    },
    levels: [
      {
        level: 3,
        name: "Locked",
        pressure: "Requires all modules at Level 3",
        details: ["Reading U3 required", "Listening U3 required", "Writing U3 required", "Speaking U3 required"],
        locked: true,
        requirement: "Writing and Speaking are still below Level 3"
      }
    ]
  }
};

export const readingPassage = {
  source: "Academic Reading Passage 2",
  title: "Urban Heat Islands",
  words: 372,
  excerpt:
    "Cities retain heat through asphalt, concrete, and dense building geometry. Researchers now measure not only average temperature but the speed at which neighbourhoods cool after sunset, because delayed cooling changes sleep, transport behaviour, and public health risk.",
  questions: [
    "Which factor delays night-time cooling in dense cities?",
    "What measurement did researchers add beyond average temperature?",
    "Which public behaviour is mentioned as affected by heat retention?"
  ]
};

export const listeningTrack = {
  title: "Campus Map Revision",
  accent: "British",
  speed: "1.1×",
  question: "Which building has moved next to the library?",
  options: ["Student office", "Science block", "Main cafeteria"]
};

export const writingTopic =
  "Some people think the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways to reduce crime. Discuss both views and give your opinion.";

export const speakingQuestions = [
  "Do you work or study?",
  "Describe an event that changed the way you think.",
  "Is it better to tell a hurtful truth or a comforting lie?"
];
