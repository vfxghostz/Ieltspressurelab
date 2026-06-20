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
  questionsByLevel?: Record<ExamLevel, ListeningQuestion[]>;
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
  questionsByLevel: Record<ExamLevel, ListeningQuestion[]>;
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
  questionsByLevel: {
    1: [
      {
        id: "l1-q1",
        timecode: 6,
        prompt: "What is the speaker doing in the opening part of the extract?",
        options: ["Introducing the topic", "Giving a list of prices", "Reading a timetable", "Ending the talk"],
        answer: "Introducing the topic"
      },
      {
        id: "l1-q2",
        timecode: 16,
        prompt: "The first part is mainly about:",
        options: ["A central idea", "A journey route", "A sports result", "A weather change"],
        answer: "A central idea"
      },
      {
        id: "l1-q3",
        timecode: 27,
        prompt: "What should the listener follow as the speaker continues?",
        options: ["How one idea connects to the next", "The design of the website", "The length of the audio file", "The background noise"],
        answer: "How one idea connects to the next"
      },
      {
        id: "l1-q4",
        timecode: 40,
        prompt: "If a detail is missed, the best IELTS strategy is to:",
        options: ["Keep listening for the next idea", "Stop answering completely", "Restart the audio immediately", "Ignore the main idea"],
        answer: "Keep listening for the next idea"
      },
      {
        id: "l1-q5",
        timecode: 54,
        prompt: "Which answer type best matches this extract?",
        options: ["Main idea / gist", "Map labelling", "Spelling a surname", "A mathematical calculation"],
        answer: "Main idea / gist"
      }
    ],
    2: [
      {
        id: "l2-q1",
        timecode: 6,
        prompt: "What is the speaker mainly doing at the beginning of the extract?",
        options: ["Introducing a central idea", "Listing historical dates", "Giving travel directions", "Reading exam instructions"],
        answer: "Introducing a central idea"
      },
      {
        id: "l2-q2",
        timecode: 14,
        prompt: "Which skill is most important for understanding this part?",
        options: ["Following the speaker's purpose", "Counting every pause", "Identifying background noise", "Memorising the audio file name"],
        answer: "Following the speaker's purpose"
      },
      {
        id: "l2-q3",
        timecode: 22,
        prompt: "When the speaker develops the idea, what should the listener focus on?",
        options: ["The link between points", "The colour of the slide", "The microphone quality", "The page controls"],
        answer: "The link between points"
      },
      {
        id: "l2-q4",
        timecode: 30,
        prompt: "The speaker's supporting detail is most likely used to:",
        options: ["Clarify the main point", "Change to an unrelated topic", "End the talk immediately", "Ask the audience to write"],
        answer: "Clarify the main point"
      },
      {
        id: "l2-q5",
        timecode: 38,
        prompt: "What should a candidate do if one phrase is missed?",
        options: ["Continue tracking the argument", "Stop listening completely", "Wait for the recording to restart", "Choose answers randomly"],
        answer: "Continue tracking the argument"
      },
      {
        id: "l2-q6",
        timecode: 47,
        prompt: "Which statement best describes the speaker's style in this extract?",
        options: ["Explanatory and idea-focused", "Purely conversational with no argument", "A list of disconnected words", "A formal railway announcement"],
        answer: "Explanatory and idea-focused"
      },
      {
        id: "l2-q7",
        timecode: 56,
        prompt: "What is the best summary task after this one-minute extract?",
        options: ["Choose the speaker's main message", "Describe the web interface", "Compare music genres", "Spell the speaker's name"],
        answer: "Choose the speaker's main message"
      }
    ],
    3: [
      {
        id: "l3-q1",
        timecode: 7,
        prompt: "Which statement best captures the speaker's opening function?",
        options: ["It frames the issue for later explanation", "It gives a complete conclusion", "It changes topic several times", "It gives only personal names"],
        answer: "It frames the issue for later explanation"
      },
      {
        id: "l3-q2",
        timecode: 16,
        prompt: "The listener is expected to infer that the speaker will:",
        options: ["Develop an argument or explanation", "Read unrelated vocabulary", "Play music for the audience", "Give a set of map directions"],
        answer: "Develop an argument or explanation"
      },
      {
        id: "l3-q3",
        timecode: 25,
        prompt: "What is the likely purpose of the detail following the opening idea?",
        options: ["To support or illustrate the claim", "To distract from the main topic", "To replace the speaker's opinion", "To provide a spelling exercise"],
        answer: "To support or illustrate the claim"
      },
      {
        id: "l3-q4",
        timecode: 34,
        prompt: "Which listening behaviour is most useful under Level 3 pressure?",
        options: ["Predicting the next logical point", "Waiting for visible countdowns", "Reading subtitles first", "Pausing after each phrase"],
        answer: "Predicting the next logical point"
      },
      {
        id: "l3-q5",
        timecode: 43,
        prompt: "The relationship between the speaker's points is best described as:",
        options: ["Main idea plus development", "Question plus unrelated answer", "List with no connection", "Instruction plus address"],
        answer: "Main idea plus development"
      },
      {
        id: "l3-q6",
        timecode: 51,
        prompt: "Which answer would be strongest in an IELTS summary question?",
        options: ["A concise paraphrase of the argument", "A description of the audio player", "A guess based only on one word", "A note about the page layout"],
        answer: "A concise paraphrase of the argument"
      },
      {
        id: "l3-q7",
        timecode: 58,
        prompt: "At the end of the extract, what should the candidate retain?",
        options: ["The speaker's overall message", "Only the final sound", "The button they clicked", "The number of visible controls"],
        answer: "The speaker's overall message"
      }
    ]
  },
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

const tedxListeningQuestions: ListeningQuestion[] = [
  {
    id: "tedx-q1",
    timecode: 5,
    prompt: "The speaker states that he does not care about the opinion of",
    options: ["A the event organizers.", "B the live audience.", "C internet users."],
    answer: "B the live audience."
  },
  {
    id: "tedx-q2",
    timecode: 10,
    prompt: "According to the speaker, online viewers are important because they",
    options: ["A share and spread the content.", "B provide financial support.", "C leave constructive feedback."],
    answer: "A share and spread the content."
  },
  {
    id: "tedx-q3",
    timecode: 16,
    prompt: "What does the speaker believe most presenters get wrong?",
    options: ["A They pick topics that are too complicated.", "B They focus on the wrong target audience.", "C They rely too heavily on their presentation slides."],
    answer: "B They focus on the wrong target audience."
  },
  {
    id: "tedx-q4",
    timecode: 22,
    prompt: "The speaker mentions Facebook as an example of a place where people",
    options: ["A upload their own videos.", "B look for educational talks.", "C casually view content."],
    answer: "C casually view content."
  },
  {
    id: "tedx-q5",
    timecode: 28,
    prompt: "What does the speaker say about people in the year 2009?",
    options: ["A They had longer attention spans.", "B They were more critical of technology.", "C They preferred reading to watching videos."],
    answer: "A They had longer attention spans."
  },
  {
    id: "tedx-q6",
    timecode: 34,
    prompt: "What is the speaker's view on modern attention spans?",
    options: ["A They have adapted to digital media.", "B They have been completely ruined.", "C They are shorter only in younger generations."],
    answer: "B They have been completely ruined."
  },
  {
    id: "tedx-q7",
    timecode: 41,
    prompt: "Regarding standard 18-minute TED talks, the speaker admits that he",
    options: ["A finds them highly educational.", "B hasn't watched one in a very long time.", "C prefers to watch them at double speed."],
    answer: "B hasn't watched one in a very long time."
  },
  {
    id: "tedx-q8",
    timecode: 47,
    prompt: "The speaker's main goal for his own presentation is to",
    options: ["A tell as many jokes as possible.", "B keep the duration under one minute.", "C change how the internet views public speaking."],
    answer: "B keep the duration under one minute."
  },
  {
    id: "tedx-q9",
    timecode: 53,
    prompt: "Before telling his final joke, the speaker notes that he",
    options: ["A has a little bit of time left.", "B forgot his main concluding point.", "C needs to explain the punchline."],
    answer: "A has a little bit of time left."
  },
  {
    id: "tedx-q10",
    timecode: 58,
    prompt: "The humor in the speaker's final joke relies on a double meaning of the word",
    options: ["A expensive.", "B balloons.", "C inflation."],
    answer: "C inflation."
  }
];

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
    { start: 0, end: 8, text: "Listen for the speaker's opening claim and purpose." },
    { start: 8, end: 16, text: "Identify the problem or situation the speaker introduces." },
    { start: 16, end: 24, text: "Notice whether the speaker gives a reason, example, or contrast." },
    { start: 24, end: 32, text: "Track the shift from the initial point to the supporting detail." },
    { start: 32, end: 42, text: "Listen for what the speaker implies rather than single isolated words." },
    { start: 42, end: 52, text: "Hold the relationship between the idea and the example." },
    { start: 52, end: 60, text: "Prepare to answer a summary-style question from one pass." }
  ],
  questionsByLevel: {
    1: tedxListeningQuestions,
    2: tedxListeningQuestions,
    3: tedxListeningQuestions
  },
  questions: tedxListeningQuestions
};

export const writingTask: WritingTask = {
  id: "writing-l1-the-forge",
  level: 1,
  mode: "The Forge",
  title: "Crime and Prison Sentences",
  topic:
    "Some people think the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways to reduce crime. Discuss both views and give your opinion.",
  topicBombSeconds: 300,
  writingSeconds: 1200,
  erasuresStart: 0,
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
