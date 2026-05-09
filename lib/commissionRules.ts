"use client";

import { useEffect, useState } from "react";
import type { Agency } from "./types";

const STORAGE_KEY = "crm-commission-rules";

export interface DomyaCommissionRule {
  baseAmount: number;
  percentage: number;
}

export interface KrijoCommissionRule {
  mode: "flat" | "percentage";
  flatAmount: number;
  percentage: number;
}

export interface CommissionRules {
  domya: DomyaCommissionRule;
  krijo: KrijoCommissionRule;
}

export const defaultCommissionRules: CommissionRules = {
  domya: { baseAmount: 0, percentage: 0 },
  krijo: { mode: "flat", flatAmount: 0, percentage: 0 },
};

function readRules(): CommissionRules {
  if (typeof window === "undefined") return defaultCommissionRules;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultCommissionRules;
    const parsed = JSON.parse(stored) as Partial<CommissionRules>;
    return {
      domya: { ...defaultCommissionRules.domya, ...(parsed.domya ?? {}) },
      krijo: { ...defaultCommissionRules.krijo, ...(parsed.krijo ?? {}) },
    };
  } catch {
    return defaultCommissionRules;
  }
}

function writeRules(rules: CommissionRules) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function useCommissionRules() {
  const [rules, setRulesState] = useState<CommissionRules>(defaultCommissionRules);

  useEffect(() => {
    setRulesState(readRules());
  }, []);

  function setRules(next: CommissionRules) {
    writeRules(next);
    setRulesState(next);
  }

  return { rules, setRules };
}

// Returns the auto-calculated commission, or null for manual-only agencies.
export function calculateCommission(
  agency: Agency,
  dealValue: number,
  rules: CommissionRules
): number | null {
  if (agency === "Domya") {
    return rules.domya.baseAmount + (rules.domya.percentage / 100) * dealValue;
  }
  if (agency === "Krijo") {
    if (rules.krijo.mode === "flat") return rules.krijo.flatAmount;
    return (rules.krijo.percentage / 100) * dealValue;
  }
  return null;
}
