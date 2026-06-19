import type { DesignTheme } from "@/src/types";

export const designThemes: DesignTheme[] = [
  {
    id: "clinical",
    label: "Clinical Command",
    shortLabel: "Clinical",
    shortCode: "CC",
    symbol: "○",
    ariaLabel: "Clinical Command theme",
    colorPair: "Slate white + clinical blue/teal",
    description: "Light premium dashboard using flat data-dense UI, Fira Sans, Fira Code, blue, teal, and amber."
  },
  {
    id: "graphite",
    label: "Graphite Drill Cockpit",
    shortLabel: "Graphite",
    shortCode: "GD",
    symbol: "◐",
    ariaLabel: "Graphite Drill Cockpit theme",
    colorPair: "OLED graphite + mint green",
    description: "Dark exam cockpit with bright working panels, stronger pressure cues, and technical telemetry."
  },
  {
    id: "bilingual",
    label: "Bilingual Tutor OS",
    shortLabel: "Bilingual",
    shortCode: "BT",
    symbol: "◇",
    ariaLabel: "Bilingual Tutor OS theme",
    colorPair: "Neutral white + calm teal/blue",
    description: "Readability-first RU/EN interface with Noto Sans fallback, softer colors, and calmer surfaces."
  }
];
