import { pressureProfile, type PressureProfile } from "@/src/data/mockExamData";

export const pressureProfileStorageKey = "ielts-pressure-lab-pressure-profile";

export const pressureProfileAxes: Array<{
  key: keyof PressureProfile;
  label: string;
  stressLabel: string;
}> = [
  { key: "timerAnxiety", label: "Timer Anxiety", stressLabel: "Clock pressure" },
  { key: "topicAnxiety", label: "Topic Anxiety", stressLabel: "Topic uncertainty" },
  { key: "socialAnxiety", label: "Social Anxiety", stressLabel: "Observed performance" },
  { key: "perfectionism", label: "Perfectionism", stressLabel: "Over-editing impulse" }
];

export function clampPressureValue(value: unknown) {
  const numberValue = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
  return Math.max(1, Math.min(10, Math.round(Number.isFinite(numberValue) ? numberValue : 5)));
}

export function isPressureProfile(value: unknown): value is PressureProfile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<Record<keyof PressureProfile, unknown>>;
  return pressureProfileAxes.every((axis) => typeof candidate[axis.key] === "number");
}

export function normalizePressureProfile(value: unknown): PressureProfile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return pressureProfile;
  }

  const candidate = value as Partial<Record<keyof PressureProfile, unknown>>;
  return {
    timerAnxiety: clampPressureValue(candidate.timerAnxiety ?? pressureProfile.timerAnxiety),
    topicAnxiety: clampPressureValue(candidate.topicAnxiety ?? pressureProfile.topicAnxiety),
    socialAnxiety: clampPressureValue(candidate.socialAnxiety ?? pressureProfile.socialAnxiety),
    perfectionism: clampPressureValue(candidate.perfectionism ?? pressureProfile.perfectionism)
  };
}

export function readStoredPressureProfile(): PressureProfile {
  if (typeof window === "undefined") {
    return pressureProfile;
  }

  const raw = window.localStorage.getItem(pressureProfileStorageKey);
  if (!raw) {
    return pressureProfile;
  }

  try {
    return normalizePressureProfile(JSON.parse(raw));
  } catch {
    return pressureProfile;
  }
}

export function saveStoredPressureProfile(profile: PressureProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(pressureProfileStorageKey, JSON.stringify(normalizePressureProfile(profile)));
}

export async function syncPressureProfile(profile: PressureProfile) {
  if (typeof window === "undefined") {
    return { ok: false, reason: "server" };
  }

  saveStoredPressureProfile(profile);
  const token = window.localStorage.getItem("ielts-pressure-lab-demo-token");

  if (!token) {
    return { ok: true, storage: "local" };
  }

  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(normalizePressureProfile(profile))
    });

    return { ok: response.ok, storage: response.ok ? "api" : "local" };
  } catch {
    return { ok: true, storage: "local" };
  }
}
