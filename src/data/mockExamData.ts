export type PressureAxis = "timerAnxiety" | "topicAnxiety" | "socialAnxiety" | "perfectionism";

export type ExamModuleId = "reading" | "listening" | "writing" | "speaking" | "gauntlet";

export type ModuleStatus = "stable" | "watch" | "critical" | "locked";

export interface PressureProfile {
  timerAnxiety: number;
  topicAnxiety: number;
  socialAnxiety: number;
  perfectionism: number;
}

export interface ChoiceQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
}

export interface ListeningQuestion extends ChoiceQuestion {
  timecode: number;
}

export type ExamLevel = 1 | 2 | 3;

export interface LevelRule {
  level: ExamLevel;
  name: string;
  pressure: string;
  details: string[];
}

export interface ReadingTask {
  id: string;
  level: 2;
  mode: "Sprint & Lock";
  title: string;
  text: string;
  wordCount: number;
  readingSeconds: number;
  recallSeconds: number;
  levels: LevelRule[];
  questions: ChoiceQuestion[];
}

export interface ListeningSubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface ListeningTask {
  id: string;
  level: 2;
  mode: "One Shot";
  sourceLabel: string;
  sourceUrl: string;
  audioUrl: string;
  durationSeconds: number;
  answerWindowSeconds: number;
  levels: LevelRule[];
  subtitles: ListeningSubtitleCue[];
  questions: ListeningQuestion[];
}

export interface WritingTask {
  id: string;
  level: 1;
  mode: "The Forge";
  title: string;
  topic: string;
  topicBombSeconds: number;
  writingSeconds: number;
  erasuresStart: number;
  erasuresLimit: number;
  targetWords: number;
}

export interface ExamModuleSummary {
  id: ExamModuleId;
  label: string;
  status: ModuleStatus;
  level: "L1" | "L2" | "L3" | "LOCK";
  description: string;
}

export const pressureProfile: PressureProfile = {
  timerAnxiety: 8,
  topicAnxiety: 6,
  socialAnxiety: 7,
  perfectionism: 9
};

export const moduleSummaries: ExamModuleSummary[] = [
  {
    id: "reading",
    label: "Reading",
    status: "stable",
    level: "L2",
    description: "Sprint & Lock recall drill"
  },
  {
    id: "listening",
    label: "Listening",
    status: "watch",
    level: "L2",
    description: "One-shot audio answers"
  },
  {
    id: "writing",
    label: "Writing",
    status: "critical",
    level: "L1",
    description: "No-delete essay forge"
  },
  {
    id: "speaking",
    label: "Speaking",
    status: "watch",
    level: "L1",
    description: "Cold-start response lab"
  },
  {
    id: "gauntlet",
    label: "Gauntlet",
    status: "locked",
    level: "LOCK",
    description: "Unlock after core modules reach L3"
  }
];

export const readingTask: ReadingTask = {
  id: "reading-l2-urban-heat-islands",
  level: 2,
  mode: "Sprint & Lock",
  title: "Urban Heat Islands",
  wordCount: 372,
  readingSeconds: 120,
  recallSeconds: 480,
  levels: [
    {
      level: 1,
      name: "Guided Read",
      pressure: "Text stays visible",
      details: ["Visible timer", "Text remains after time", "Questions can be answered with the passage open"]
    },
    {
      level: 2,
      name: "Sprint & Lock",
      pressure: "Text disappears after finish or timeout",
      details: ["Visible timer", "I finished button", "Memory recall after lock"]
    },
    {
      level: 3,
      name: "Blind Sprint",
      pressure: "Hidden timer and hidden questions",
      details: ["No visible countdown", "No questions during reading", "Recall opens after finish or internal timeout"]
    }
  ],
  text: `Cities are often several degrees warmer than their surrounding countryside, especially after sunset. This pattern is known as the urban heat island effect, and it is created by the way streets, buildings, traffic, and human activity store and release heat. During the day, dark asphalt and concrete absorb solar energy. At night, instead of cooling quickly like soil or vegetation, these surfaces return stored heat to the air. Tall buildings can also trap warm air between them, slowing the movement of wind that would normally carry heat away.

The effect is not simply uncomfortable. In many cities it changes public health, energy use, and daily movement. Higher night-time temperatures make sleep harder, particularly for older residents and people without air conditioning. Electricity demand rises as homes, offices, and transport systems use more cooling. When heat combines with pollution, breathing problems may increase. A hot bus stop or an unshaded walk to school can become a practical barrier, not just a minor inconvenience.

Urban planners can reduce this pressure by changing the surfaces and patterns of the city. Trees cool streets through shade and evaporation, while parks create pockets of cooler air. Light-coloured roofs and pavements reflect more sunlight and absorb less heat. Some cities use green roofs, water-sensitive design, and shaded corridors to connect cooler areas. These strategies work best when they are placed where people actually wait, walk, study, and work.

However, solutions must be planned carefully. New parks can raise nearby rents if communities are not protected, and tree planting fails when maintenance is ignored. The most effective heat policies treat cooling as basic infrastructure, like drainage or lighting. A city that prepares for heat does not only look greener; it becomes safer, more equal, and more usable during the hottest weeks of the year.`,
  questions: [
    {
      id: "r-q1",
      prompt: "Which materials are described as storing solar energy during the day?",
      options: ["Glass and steel", "Asphalt and concrete", "Soil and vegetation", "Water and clay"],
      answer: "Asphalt and concrete"
    },
    {
      id: "r-q2",
      prompt: "Why can tall buildings make the heat island effect worse?",
      options: ["They reflect all sunlight", "They slow wind movement", "They create more parks", "They reduce electricity demand"],
      answer: "They slow wind movement"
    },
    {
      id: "r-q3",
      prompt: "What does the passage say the best heat policies should treat cooling as?",
      options: ["Luxury design", "Tourist branding", "Basic infrastructure", "Temporary decoration"],
      answer: "Basic infrastructure"
    }
  ]
};

export const listeningTask: ListeningTask = {
  id: "listening-l2-tedx-one-shot",
  level: 2,
  mode: "One Shot",
  sourceLabel: "TEDx MP3 One Shot · 60 seconds",
  sourceUrl: "/audio/tedxtalk.mp3",
  audioUrl: "/audio/tedxtalk.mp3",
  durationSeconds: 60,
  answerWindowSeconds: 5,
  levels: [
    {
      level: 1,
      name: "Guided Audio",
      pressure: "Pause, rewind, and subtitles available",
      details: ["Native controls enabled", "Timed gist cues visible", "Questions always available"]
    },
    {
      level: 2,
      name: "One Shot",
      pressure: "No pause or rewind after start",
      details: ["Questions appear during audio", "Visible 5s answer timer", "Missed answers are marked"]
    },
    {
      level: 3,
      name: "Blind One Shot",
      pressure: "No visible answer timer",
      details: ["No replay", "Question windows are hidden-pressure", "Missed answers counted silently"]
    }
  ],
  subtitles: [
    { start: 0, end: 8, text: "Opening idea: catch the speaker's first framing quickly." },
    { start: 8, end: 16, text: "Listen for the topic and the speaker's main direction." },
    { start: 16, end: 24, text: "The talk uses natural presentation speech, not isolated exam words." },
    { start: 24, end: 32, text: "Focus on intention and contrast rather than every exact word." },
    { start: 32, end: 42, text: "Keep moving with the speaker even if one detail is missed." },
    { start: 42, end: 52, text: "Commit from one pass; do not wait for a replay." },
    { start: 52, end: 60, text: "Hold the opening message after the one-minute section ends." }
  ],
  questions: [
    { id: "l-q1", timecode: 5, prompt: "What kind of recording is this?", options: ["A public talk", "A song", "A train announcement", "A weather report"], answer: "A public talk" },
    { id: "l-q2", timecode: 12, prompt: "How many main speakers are heard at this point?", options: ["One", "Two", "A group", "No speaker"], answer: "One" },
    { id: "l-q3", timecode: 19, prompt: "What should you catch first under pressure?", options: ["The main direction", "Every exact word", "The video title", "The interface color"], answer: "The main direction" },
    { id: "l-q4", timecode: 27, prompt: "The speaker sounds closest to:", options: ["A presentation speaker", "A singer", "A sports commentator", "A robot voice"], answer: "A presentation speaker" },
    { id: "l-q5", timecode: 35, prompt: "If one detail is missed, what is the best strategy?", options: ["Keep following the speaker", "Stop the test", "Wait for replay", "Ignore the rest"], answer: "Keep following the speaker" },
    { id: "l-q6", timecode: 44, prompt: "What pressure skill is being trained here?", options: ["Answering from one pass", "Using subtitles only", "Reading an essay", "Memorizing button labels"], answer: "Answering from one pass" },
    { id: "l-q7", timecode: 53, prompt: "At the end of the minute, what matters most?", options: ["The opening message", "The player controls", "The file size", "The page layout"], answer: "The opening message" }
  ]
};

export const writingTask: WritingTask = {
  id: "writing-l1-the-forge",
  level: 1,
  mode: "The Forge",
  title: "Crime and Prison Sentences",
  topic:
    "Some people think the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways to reduce crime. Discuss both views and give your opinion.",
  topicBombSeconds: 5,
  writingSeconds: 1200,
  erasuresStart: 2,
  erasuresLimit: 5,
  targetWords: 250
};

export const mockExamData = {
  pressureProfile,
  moduleSummaries,
  reading: readingTask,
  listening: listeningTask,
  writing: writingTask
};
