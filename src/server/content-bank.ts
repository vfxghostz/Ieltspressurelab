import type {
  AudioTrack,
  BadgeDefinition,
  PressureLabBackendConfig,
  ReadingPassage,
  SpeakingQuestion,
  WritingTopic
} from "@/src/types/backend";

export const backendConfig: PressureLabBackendConfig = {
  writing: {
    moduleName: "The Forge",
    topicBombSeconds: 3,
    planningSeconds: 30,
    writingSeconds: 40 * 60,
    erasuresLimit: 5,
    targetWords: 260,
    targetWpm: 6.5
  },
  speaking: {
    moduleName: "The Mirror",
    coldStartSeconds: 15,
    silenceThresholdMs: 2000,
    cameraRequired: true,
    neutralFace: true
  }
};

export const readingPassages: ReadingPassage[] = [
  {
    id: "urban-heat",
    title: "Urban Heat and Public Health",
    content:
      "Cities often become warmer than surrounding rural areas because roads, buildings, and transport systems absorb and retain heat. This effect is strongest at night, when stored heat is slowly released back into the air. Researchers argue that urban heat is not only an environmental issue but also a public health concern, particularly for older residents and people with existing illnesses. Tree cover, reflective roofing, and shaded transport routes can reduce exposure, but these measures require long-term planning rather than emergency response.",
    wordCount: 86,
    difficulty: "easy",
    topic: "environment",
    questions: [
      {
        id: "urban-heat-q1",
        question: "Why are cities often warmer than rural areas?",
        options: ["They receive more rainfall", "They absorb and retain heat", "They have fewer people", "They are closer to the sea"],
        correctAnswer: "They absorb and retain heat",
        questionType: "multiple_choice"
      },
      {
        id: "urban-heat-q2",
        question: "Urban heat is described as a public health concern.",
        options: ["true", "false"],
        correctAnswer: "true",
        questionType: "true_false"
      }
    ]
  },
  {
    id: "ai-education",
    title: "Adaptive Technology in Education",
    content:
      "Adaptive learning software promises to adjust lessons to each student's pace, but its results depend heavily on how teachers use it. When software becomes a replacement for instruction, students may complete exercises without understanding why mistakes occurred. When teachers use the data to identify patterns and intervene, the same tools can reveal gaps that would otherwise remain hidden. The most effective classrooms treat technology as a diagnostic instrument rather than a substitute for human judgement.",
    wordCount: 78,
    difficulty: "medium",
    topic: "education",
    questions: [
      {
        id: "ai-education-q1",
        question: "According to the passage, adaptive software is most useful when it is used as...",
        options: ["a teacher replacement", "a diagnostic instrument", "a homework ban", "a social network"],
        correctAnswer: "a diagnostic instrument",
        questionType: "multiple_choice"
      },
      {
        id: "ai-education-q2",
        question: "The passage suggests teacher judgement remains important.",
        options: ["true", "false"],
        correctAnswer: "true",
        questionType: "true_false"
      }
    ]
  }
];

export const audioTracks: AudioTrack[] = [
  {
    id: "library-tour",
    title: "Library Orientation",
    fileUrl: "/audio/placeholders/library-tour.mp3",
    duration: 185,
    accent: "british",
    difficulty: "easy",
    questions: [
      {
        id: "library-tour-q1",
        timestamp: 18,
        question: "Where should new students collect their library cards?",
        options: ["Main desk", "Second floor", "Online portal", "Cafeteria"],
        correctAnswer: "Main desk"
      },
      {
        id: "library-tour-q2",
        timestamp: 92,
        question: "How long can standard books be borrowed?",
        options: ["One week", "Two weeks", "Four weeks", "One semester"],
        correctAnswer: "Two weeks"
      }
    ]
  },
  {
    id: "marine-study",
    title: "Marine Biology Seminar",
    fileUrl: "/audio/placeholders/marine-study.mp3",
    duration: 240,
    accent: "australian",
    difficulty: "medium",
    questions: [
      {
        id: "marine-study-q1",
        timestamp: 45,
        question: "What was the main aim of the coastal survey?",
        options: ["Mapping tourism", "Testing water temperature", "Counting species", "Measuring boat traffic"],
        correctAnswer: "Counting species"
      }
    ]
  }
];

export const writingTopics: WritingTopic[] = [
  {
    id: "crime-sentences",
    taskType: "task2",
    category: "discussion",
    difficulty: "medium",
    topic:
      "Some people think the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways to reduce crime. Discuss both views and give your opinion."
  },
  {
    id: "fast-food",
    taskType: "task2",
    category: "opinion",
    difficulty: "medium",
    topic:
      "In many countries, traditional foods are being replaced by international fast food. This has a negative effect on families and societies. To what extent do you agree or disagree?"
  },
  {
    id: "technology-education",
    taskType: "task2",
    category: "discussion",
    difficulty: "easy",
    topic:
      "Some people believe that technology has made education more effective, while others think it distracts students from deep learning. Discuss both views and give your opinion."
  }
];

export const speakingQuestions: SpeakingQuestion[] = [
  {
    id: "p1-study",
    part: "part1",
    question: "Do you work or study?",
    isDilemma: false,
    followUps: ["Why did you choose this field?", "What part of your work or study is most demanding?"]
  },
  {
    id: "p1-hometown",
    part: "part1",
    question: "What do you like most about your hometown?",
    isDilemma: false,
    followUps: ["Has it changed much recently?", "Would you like to live there in the future?"]
  },
  {
    id: "p2-event",
    part: "part2",
    question: "Describe an event that changed the way you think. You should say what happened, who was involved, and why it affected you.",
    isDilemma: false,
    followUps: []
  },
  {
    id: "p3-dangerous-sports",
    part: "part3",
    question: "Should governments ban dangerous sports, or is personal freedom more important?",
    isDilemma: true,
    followUps: ["Who should be responsible when people are injured?", "Do rules reduce courage or protect it?"]
  },
  {
    id: "p3-hurtful-truth",
    part: "part3",
    question: "Is it better to tell a hurtful truth or a comforting lie?",
    isDilemma: true,
    followUps: ["Does the answer change in professional situations?", "Can honesty be harmful?"]
  }
];

export const badgeDefinitions: BadgeDefinition[] = [
  {
    badgeType: "pace-badge",
    name: "Pace Master",
    description: "Complete 5 Listening sessions with 0 missed answers",
    status: "stable"
  },
  {
    badgeType: "iron-pen",
    name: "Iron Pen",
    description: "Complete 3 essays in No-Delete mode within time limit",
    status: "watch"
  },
  {
    badgeType: "cold-blood",
    name: "Cold Blood",
    description: "Complete a Cold Start with pause under 3 seconds",
    status: "critical"
  },
  {
    badgeType: "gauntlet-survivor",
    name: "Gauntlet Survivor",
    description: "Complete the full 4-section exam",
    status: "locked"
  }
];
