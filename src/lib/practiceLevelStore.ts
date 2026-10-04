export type PracticeLevel = "beginner" | "intermediate" | "advanced";

const STORAGE_KEY = "mujam:practice-level";
const DEFAULT_LEVEL: PracticeLevel = "intermediate";

export function getStoredPracticeLevel(): PracticeLevel {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "beginner" || raw === "intermediate" || raw === "advanced") return raw;
    return DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

export function setStoredPracticeLevel(level: PracticeLevel): void {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Private browsing / storage disabled — the choice just won't persist.
  }
}
