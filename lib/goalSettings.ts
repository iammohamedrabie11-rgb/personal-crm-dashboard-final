"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "crm-goal-settings";

export interface GoalSettings {
  monthlyIncomeGoal: number;
}

const defaultGoalSettings: GoalSettings = {
  monthlyIncomeGoal: 0,
};

function readGoal(): GoalSettings {
  if (typeof window === "undefined") return defaultGoalSettings;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultGoalSettings;
    const parsed = JSON.parse(stored) as Partial<GoalSettings>;
    return {
      monthlyIncomeGoal: Number(parsed.monthlyIncomeGoal ?? 0),
    };
  } catch {
    return defaultGoalSettings;
  }
}

function writeGoal(settings: GoalSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useGoalSettings() {
  const [goal, setGoalState] = useState<GoalSettings>(defaultGoalSettings);

  useEffect(() => {
    setGoalState(readGoal());
  }, []);

  function setGoal(next: GoalSettings) {
    writeGoal(next);
    setGoalState(next);
  }

  return { goal, setGoal };
}
