"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "crm-goal-settings";
const CHANGE_EVENT = "crm-goal-settings-change";

export interface GoalSettings {
  monthlyIncomeGoal: number;
}

const defaultGoalSettings: GoalSettings = {
  monthlyIncomeGoal: 0,
};

let cachedRawValue: string | null = null;
let cachedGoal = defaultGoalSettings;

function readGoal(): GoalSettings {
  if (typeof window === "undefined") return defaultGoalSettings;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    if (stored === cachedRawValue) return cachedGoal;
    if (!stored) {
      cachedRawValue = stored;
      cachedGoal = defaultGoalSettings;
      return cachedGoal;
    }

    const parsed = JSON.parse(stored) as Partial<GoalSettings>;
    cachedRawValue = stored;
    cachedGoal = {
      monthlyIncomeGoal: Number(parsed.monthlyIncomeGoal ?? 0),
    };
    return cachedGoal;
  } catch {
    return defaultGoalSettings;
  }
}

function writeGoal(settings: GoalSettings) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(settings);
  cachedRawValue = serialized;
  cachedGoal = settings;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribeToGoal(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useGoalSettings() {
  const goal = useSyncExternalStore(
    subscribeToGoal,
    readGoal,
    () => defaultGoalSettings
  );

  function setGoal(next: GoalSettings) {
    writeGoal(next);
  }

  return { goal, setGoal };
}
