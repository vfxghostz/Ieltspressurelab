import type { Locale, PressureLevel, VariantId } from "@/src/types";

type VariantCopy = Record<VariantId, { label: string; description: string }>;

export interface UiCopy {
  localeName: string;
  topbar: {
    designLab: string;
    variantNav: string;
    themeNav: string;
    languageNav: string;
    currentDesign: string;
    themeLabel: string;
  };
  account: {
    menuLabel: string;
    guestMode: string;
    signedInAs: string;
    profile: string;
    login: string;
    signUp: string;
    logout: string;
    accessLabel: string;
    loginTitle: string;
    signUpTitle: string;
    loginDescription: string;
    signUpDescription: string;
    name: string;
    email: string;
    password: string;
    close: string;
    hasAccount: string;
    needsAccount: string;
  };
  variants: VariantCopy;
  themes: {
    clinical: { label: string; description: string };
    graphite: { label: string; description: string };
    bilingual: { label: string; description: string };
  };
  status: Record<PressureLevel, string>;
  common: {
    modules: string;
    words: string;
    items: string;
    target: string;
    duration: string;
    rule: string;
    metric: string;
    secondary: string;
    openLane: string;
    level: string;
  };
  cockpit: {
    activeDrill: string;
    passageLocksIn: string;
    constraintStartsIn: string;
    hiddenTimeAvailable: string;
    startDrill: string;
    lockPassage: string;
    resetRun: string;
    sessionStateLabel: string;
    runState: {
      idle: string;
      running: string;
      locked: string;
      submitted: string;
    };
    openModule: string;
    lockedPreviewLabel: string;
    passageReturns: string;
    memoryCheck: string;
    questionsFromMemory: string;
    submitAnswers: string;
    telemetry: string;
    pace: string;
    paceNote: string;
  };
  map: {
    planLabel: string;
    title: string;
    queueNextSession: string;
    gauntletLabel: string;
    gauntletReady: string;
    gauntletLocked: string;
    gauntletDescription: string;
    startGauntlet: string;
    unlockLevel3: string;
    personalBadges: string;
    noLeaderboard: string;
  };
  command: {
    label: string;
    title: string;
    description: string;
    nextSectionStartsIn: string;
    recommendedDrill: string;
    beginPressureRun: string;
    sessionQueue: string;
    todaysConstraints: string;
    skillReadiness: string;
    levelGates: string;
  };
  backendTools: {
    label: string;
    title: string;
    description: string;
    writing: string;
    speaking: string;
    createWriting: string;
    createSpeaking: string;
    noSession: string;
    activeSession: string;
    erasures: string;
    target: string;
    coldStart: string;
    questions: string;
  };
  profile: {
    pressureProfile: string;
    weakestAreaWriting: string;
    outOfTen: string;
  };
  questionState: {
    answered: string;
    missed: string;
    open: string;
  };
}

export const uiCopy: Record<Locale, UiCopy> = {
  en: {
    localeName: "English",
    topbar: {
      designLab: "Design Lab",
      variantNav: "Frontend variants",
      themeNav: "Design system themes",
      languageNav: "Interface language",
      currentDesign: "Current design direction",
      themeLabel: "Theme"
    },
    account: {
      menuLabel: "Account menu",
      guestMode: "Guest mode",
      signedInAs: "Signed in as",
      profile: "Profile",
      login: "Login",
      signUp: "Sign up",
      logout: "Log out",
      accessLabel: "Account access",
      loginTitle: "Log in to your account",
      signUpTitle: "Create your account",
      loginDescription: "Continue into your private pressure-training workspace.",
      signUpDescription: "Create a learner profile for saved progress, sessions, and badges.",
      name: "Name",
      email: "Email",
      password: "Password",
      close: "Close account panel",
      hasAccount: "Already have an account? Log in",
      needsAccount: "Need an account? Sign up"
    },
    variants: {
      cockpit: {
        label: "Module Console",
        description: "Full Reading, Listening, Writing, Speaking, and Gauntlet pressure workflows."
      },
      map: {
        label: "Training Map",
        description: "Adaptive skill lanes, unlock logic, personal badges, and Gauntlet readiness."
      },
      command: {
        label: "Command Center",
        description: "Dashboard overview combining next session, profile, and pressure telemetry."
      }
    },
    themes: {
      clinical: {
        label: "Clinical Command",
        description: "Light premium dashboard with blue, teal, amber, Fira Sans, and Fira Code."
      },
      graphite: {
        label: "Graphite Drill Cockpit",
        description: "Dark exam cockpit with stronger pressure contrast and focused telemetry."
      },
      bilingual: {
        label: "Bilingual Tutor OS",
        description: "Readability-first RU/EN surface with Noto Sans fallback and calmer panels."
      }
    },
    status: {
      stable: "Stable",
      watch: "Watch",
      critical: "Critical",
      locked: "Locked"
    },
    common: {
      modules: "Modules",
      words: "words",
      items: "items",
      target: "target",
      duration: "Duration",
      rule: "Rule",
      metric: "Metric",
      secondary: "Secondary",
      openLane: "Open lane",
      level: "L"
    },
    cockpit: {
      activeDrill: "Active Drill",
      passageLocksIn: "Passage locks in",
      constraintStartsIn: "Constraint window",
      hiddenTimeAvailable: "Time Hidden available at Level 3",
      startDrill: "Start Drill",
      lockPassage: "Lock Passage",
      resetRun: "Reset Run",
      sessionStateLabel: "Session state",
      runState: {
        idle: "Ready — passage visible",
        running: "Running — timer pressure active",
        locked: "Locked — answer from memory",
        submitted: "Submitted — review state"
      },
      openModule: "Open module workspace",
      lockedPreviewLabel: "Locked text preview",
      passageReturns: "Passage returns only after submit.",
      memoryCheck: "Memory check",
      questionsFromMemory: "Questions from memory",
      submitAnswers: "Submit Answers",
      telemetry: "Telemetry",
      pace: "Pace",
      paceNote: "Reading speed is close, but Level 3 stays locked until accuracy holds above 75% at 200 wpm."
    },
    map: {
      planLabel: "Adaptive Pressure Plan",
      title: "Unlock exam conditions skill by skill",
      queueNextSession: "Queue Next Session",
      gauntletLabel: "Full Exam Simulation",
      gauntletReady: "Gauntlet Ready",
      gauntletLocked: "Gauntlet Locked",
      gauntletDescription:
        "Reading, Listening, Writing, and Speaking must all reach Level 3 before the uninterrupted exam flow opens.",
      startGauntlet: "Start Gauntlet",
      unlockLevel3: "Unlock Level 3",
      personalBadges: "Personal badges",
      noLeaderboard: "No leaderboard"
    },
    command: {
      label: "Exam Command Center",
      title: "Train the moment that usually breaks performance",
      description:
        "The dashboard keeps pressure visible: weakest area, next irreversible constraint, unlock path, and the session telemetry that matters before the timer starts.",
      nextSectionStartsIn: "Next section starts in",
      recommendedDrill: "Recommended Drill",
      beginPressureRun: "Begin Pressure Run",
      sessionQueue: "Session Queue",
      todaysConstraints: "Today's constraints",
      skillReadiness: "Skill Readiness",
      levelGates: "Level gates"
    },
    backendTools: {
      label: "Server practice tools",
      title: "Writing Forge + Speaking Mirror API",
      description: "Creates real server sessions for No-Delete writing and Cold Start speaking. No AI feedback, no social comparison.",
      writing: "Writing",
      speaking: "Speaking",
      createWriting: "Create Writing Session",
      createSpeaking: "Create Speaking Session",
      noSession: "No session yet",
      activeSession: "Active session",
      erasures: "erasures",
      target: "target",
      coldStart: "cold start",
      questions: "questions"
    },
    profile: {
      pressureProfile: "Pressure Profile",
      weakestAreaWriting: "Weakest area: Writing",
      outOfTen: "out of 10"
    },
    questionState: {
      answered: "Answered",
      missed: "Missed",
      open: "Open"
    }
  },
  ru: {
    localeName: "Русский",
    topbar: {
      designLab: "Дизайн-лаборатория",
      variantNav: "Варианты интерфейса",
      themeNav: "Темы дизайн-системы",
      languageNav: "Язык интерфейса",
      currentDesign: "Текущее направление дизайна",
      themeLabel: "Тема"
    },
    account: {
      menuLabel: "Меню аккаунта",
      guestMode: "Гостевой режим",
      signedInAs: "Вы вошли как",
      profile: "Профиль",
      login: "Войти",
      signUp: "Зарегистрироваться",
      logout: "Выйти",
      accessLabel: "Доступ к аккаунту",
      loginTitle: "Войти в аккаунт",
      signUpTitle: "Создать аккаунт",
      loginDescription: "Продолжи в личном рабочем пространстве pressure-training.",
      signUpDescription: "Создай профиль ученика для сохранения прогресса, сессий и бейджей.",
      name: "Имя",
      email: "Email",
      password: "Пароль",
      close: "Закрыть панель аккаунта",
      hasAccount: "Уже есть аккаунт? Войти",
      needsAccount: "Нужен аккаунт? Зарегистрироваться"
    },
    variants: {
      cockpit: {
        label: "Консоль модулей",
        description: "Reading, Listening, Writing, Speaking и Gauntlet в одном pressure-интерфейсе."
      },
      map: {
        label: "Карта тренировки",
        description: "Навыки, уровни, личные бейджи и готовность к Gauntlet."
      },
      command: {
        label: "Командный центр",
        description: "Обзор следующей сессии, профиля давления и телеметрии."
      }
    },
    themes: {
      clinical: {
        label: "Clinical Command",
        description: "Светлый premium dashboard: blue, teal, amber, Fira Sans и Fira Code."
      },
      graphite: {
        label: "Graphite Drill Cockpit",
        description: "Темный экзаменационный кокпит с более сильным ощущением давления."
      },
      bilingual: {
        label: "Bilingual Tutor OS",
        description: "Максимальная читаемость RU/EN, Noto Sans fallback и спокойные панели."
      }
    },
    status: {
      stable: "Стабильно",
      watch: "Внимание",
      critical: "Критично",
      locked: "Закрыто"
    },
    common: {
      modules: "Модули",
      words: "слов",
      items: "пункта",
      target: "цель",
      duration: "Длительность",
      rule: "Правило",
      metric: "Метрика",
      secondary: "Дополнительно",
      openLane: "Открыть линию",
      level: "У"
    },
    cockpit: {
      activeDrill: "Активная тренировка",
      passageLocksIn: "Текст закроется через",
      constraintStartsIn: "Окно ограничения",
      hiddenTimeAvailable: "Скрытый таймер доступен на уровне 3",
      startDrill: "Начать тренировку",
      lockPassage: "Закрыть текст",
      resetRun: "Сбросить попытку",
      sessionStateLabel: "Состояние сессии",
      runState: {
        idle: "Готово — текст виден",
        running: "Идет — давление таймера активно",
        locked: "Закрыто — отвечай по памяти",
        submitted: "Отправлено — режим разбора"
      },
      openModule: "Открыть рабочую панель модуля",
      lockedPreviewLabel: "Превью закрытого текста",
      passageReturns: "Текст вернется только после отправки.",
      memoryCheck: "Проверка памяти",
      questionsFromMemory: "Вопросы по памяти",
      submitAnswers: "Отправить ответы",
      telemetry: "Телеметрия",
      pace: "Темп",
      paceNote: "Скорость близка к цели, но уровень 3 закрыт, пока точность не держится выше 75% при 200 wpm."
    },
    map: {
      planLabel: "Адаптивный план давления",
      title: "Открывай экзаменационные условия по навыкам",
      queueNextSession: "Поставить следующую сессию",
      gauntletLabel: "Полная симуляция экзамена",
      gauntletReady: "Gauntlet готов",
      gauntletLocked: "Gauntlet закрыт",
      gauntletDescription:
        "Reading, Listening, Writing и Speaking должны дойти до уровня 3, прежде чем откроется непрерывный экзамен.",
      startGauntlet: "Начать Gauntlet",
      unlockLevel3: "Открыть уровень 3",
      personalBadges: "Личные бейджи",
      noLeaderboard: "Без рейтингов"
    },
    command: {
      label: "Экзаменационный командный центр",
      title: "Тренируй момент, где обычно ломается результат",
      description:
        "Панель держит давление видимым: слабая зона, следующее необратимое ограничение, путь разблокировки и телеметрия до старта таймера.",
      nextSectionStartsIn: "Следующая секция начнется через",
      recommendedDrill: "Рекомендуемая тренировка",
      beginPressureRun: "Начать pressure run",
      sessionQueue: "Очередь сессий",
      todaysConstraints: "Ограничения на сегодня",
      skillReadiness: "Готовность навыков",
      levelGates: "Уровневые пороги"
    },
    backendTools: {
      label: "Серверные инструменты практики",
      title: "API Writing Forge + Speaking Mirror",
      description: "Создает настоящие серверные сессии для No-Delete writing и Cold Start speaking. Без AI-фидбека и сравнений.",
      writing: "Writing",
      speaking: "Speaking",
      createWriting: "Создать Writing-сессию",
      createSpeaking: "Создать Speaking-сессию",
      noSession: "Сессии пока нет",
      activeSession: "Активная сессия",
      erasures: "удалений",
      target: "цель",
      coldStart: "cold start",
      questions: "вопросов"
    },
    profile: {
      pressureProfile: "Профиль давления",
      weakestAreaWriting: "Слабая зона: Writing",
      outOfTen: "из 10"
    },
    questionState: {
      answered: "Отвечено",
      missed: "Пропущено",
      open: "Открыто"
    }
  }
};
