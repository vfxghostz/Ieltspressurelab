export interface AnswerCheck {
  id: string;
  expected: string;
  actual: string;
  correct: boolean;
}

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function renderProgressBar(percent: number, cells = 10) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  const filled = Math.round((safePercent / 100) * cells);
  return `${"█".repeat(filled)}${"░".repeat(cells - filled)}`;
}

export function checkAnswers(expected: Array<{ id: string; answer: string }>, actual: Record<string, string>): AnswerCheck[] {
  return expected.map((question) => {
    const actualAnswer = actual[question.id] ?? "";
    return {
      id: question.id,
      expected: question.answer,
      actual: actualAnswer,
      correct: normalizeAnswer(actualAnswer) === normalizeAnswer(question.answer)
    };
  });
}

export function calculateAccuracy(correct: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((correct / total) * 100);
}

export function accuracyToBand(accuracy: number) {
  if (accuracy >= 95) return 9;
  if (accuracy >= 88) return 8.5;
  if (accuracy >= 80) return 8;
  if (accuracy >= 72) return 7.5;
  if (accuracy >= 64) return 7;
  if (accuracy >= 56) return 6.5;
  if (accuracy >= 48) return 6;
  if (accuracy >= 40) return 5.5;
  if (accuracy >= 32) return 5;
  if (accuracy >= 24) return 4.5;
  if (accuracy >= 16) return 4;
  if (accuracy >= 8) return 3.5;
  return 3;
}

export function countWords(text: string) {
  const words = text.trim().match(/\b[\p{L}\p{N}'-]+\b/gu);
  return words?.length ?? 0;
}

export function calculateWpm(words: number, elapsedSeconds: number) {
  if (elapsedSeconds <= 0) {
    return 0;
  }

  return Math.round(words / (elapsedSeconds / 60));
}
