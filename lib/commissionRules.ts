"use client";

import { useSyncExternalStore } from "react";
import type { Agency } from "./types";

const STORAGE_KEY = "crm-commission-rules";
const CHANGE_EVENT = "crm-commission-rules-change";

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

let cachedRawValue: string | null = null;
let cachedRules = defaultCommissionRules;

function readRules(): CommissionRules {
  if (typeof window === "undefined") return defaultCommissionRules;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    if (stored === cachedRawValue) return cachedRules;
    if (!stored) {
      cachedRawValue = stored;
      cachedRules = defaultCommissionRules;
      return cachedRules;
    }

    const parsed = JSON.parse(stored) as Partial<CommissionRules>;
    cachedRawValue = stored;
    cachedRules = {
      domya: { ...defaultCommissionRules.domya, ...(parsed.domya ?? {}) },
      krijo: { ...defaultCommissionRules.krijo, ...(parsed.krijo ?? {}) },
    };
    return cachedRules;
  } catch {
    return defaultCommissionRules;
  }
}

function writeRules(rules: CommissionRules) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(rules);
  cachedRawValue = serialized;
  cachedRules = rules;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribeToRules(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useCommissionRules() {
  const rules = useSyncExternalStore(
    subscribeToRules,
    readRules,
    () => defaultCommissionRules
  );

  function setRules(next: CommissionRules) {
    writeRules(next);
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
    if (rules.domya.baseAmount <= 0 && rules.domya.percentage <= 0) return null;
    return rules.domya.baseAmount + (rules.domya.percentage / 100) * dealValue;
  }

  if (agency === "Krijo") {
    if (rules.krijo.mode === "flat") {
      return rules.krijo.flatAmount > 0 ? rules.krijo.flatAmount : null;
    }
    if (rules.krijo.percentage <= 0) return null;
    return (rules.krijo.percentage / 100) * dealValue;
  }

  return null;
}
