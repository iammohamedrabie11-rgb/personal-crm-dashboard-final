"use client";

import { dummyIncomeEntries, dummyLeads } from "./dummyData";
import { IncomeEntry, Lead } from "./types";
import type { FinanceData } from "./financeStorage";

const CRM_STORAGE_KEY = "personal-crm-dashboard-data-v1";
const FINANCE_STORAGE_KEY = "personal-crm-dashboard-finance-v1";

interface CrmData {
  leads: Lead[];
  incomeEntries: IncomeEntry[];
}

export interface AppSnapshot {
  crm: CrmData;
  finance: FinanceData;
}

const defaultCrmData: CrmData = {
  leads: dummyLeads,
  incomeEntries: dummyIncomeEntries,
};

export const defaultFinanceData: FinanceData = {
  accounts: [
    {
      id: "account-cash",
      name: "Cash",
      type: "Cash",
      balance: 2500,
      notes: "Daily spending money",
    },
    {
      id: "account-bank",
      name: "Main bank account",
      type: "Bank account",
      balance: 18000,
      notes: "Primary account",
    },
    {
      id: "account-emergency",
      name: "Emergency fund",
      type: "Emergency fund",
      balance: 12000,
      notes: "Do not spend unless needed",
    },
  ],
  expenses: [
    {
      id: "expense-food",
      date: new Date().toISOString().split("T")[0],
      category: "Food",
      description: "Groceries",
      amount: 1200,
      accountId: "account-cash",
      status: "Paid",
      notes: "",
    },
    {
      id: "expense-subscriptions",
      date: new Date().toISOString().split("T")[0],
      category: "Subscriptions",
      description: "Apps and services",
      amount: 850,
      accountId: "account-bank",
      status: "Recurring",
      notes: "",
    },
  ],
  budgets: [
    { id: "budget-food", category: "Food", amount: 5000 },
    { id: "budget-transport", category: "Transport", amount: 2000 },
    { id: "budget-subscriptions", category: "Subscriptions", amount: 1200 },
  ],
  plannedPayments: [
    {
      id: "payment-gym",
      name: "Gym membership",
      amount: 900,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20)
        .toISOString()
        .split("T")[0],
      category: "Gym/Fitness",
      accountId: "account-bank",
      status: "Upcoming",
      notes: "",
    },
  ],
};

let currentSnapshot: AppSnapshot = {
  crm: defaultCrmData,
  finance: defaultFinanceData,
};
let hasLoadedStorage = false;
let past: AppSnapshot[] = [];
let future: AppSnapshot[] = [];
const listeners = new Set<() => void>();

function cloneSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as AppSnapshot;
}

function readCrmData(): CrmData {
  if (typeof window === "undefined") return defaultCrmData;

  try {
    const stored = window.localStorage.getItem(CRM_STORAGE_KEY);
    if (!stored) return defaultCrmData;
    const parsed = JSON.parse(stored) as Partial<CrmData>;
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : defaultCrmData.leads,
      incomeEntries: Array.isArray(parsed.incomeEntries)
        ? parsed.incomeEntries
        : defaultCrmData.incomeEntries,
    };
  } catch {
    return defaultCrmData;
  }
}

function readFinanceData(): FinanceData {
  if (typeof window === "undefined") return defaultFinanceData;

  try {
    const stored = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!stored) return defaultFinanceData;
    const parsed = JSON.parse(stored) as Partial<FinanceData>;
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : defaultFinanceData.accounts,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : defaultFinanceData.expenses,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : defaultFinanceData.budgets,
      plannedPayments: Array.isArray(parsed.plannedPayments)
        ? parsed.plannedPayments
        : defaultFinanceData.plannedPayments,
    };
  } catch {
    return defaultFinanceData;
  }
}

function persistSnapshot(snapshot: AppSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(snapshot.crm));
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(snapshot.finance));
}

function emit() {
  listeners.forEach((listener) => listener());
}

function loadStorageIfNeeded() {
  if (hasLoadedStorage || typeof window === "undefined") return;
  currentSnapshot = {
    crm: readCrmData(),
    finance: readFinanceData(),
  };
  hasLoadedStorage = true;
}

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  loadStorageIfNeeded();
  listener();

  return () => {
    listeners.delete(listener);
  };
}

export function getHistorySnapshot() {
  loadStorageIfNeeded();
  return currentSnapshot;
}

export function getHistoryAvailability() {
  loadStorageIfNeeded();
  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

export function updateHistory(updater: (snapshot: AppSnapshot) => AppSnapshot) {
  loadStorageIfNeeded();
  past = [...past, cloneSnapshot(currentSnapshot)];
  future = [];
  currentSnapshot = updater(cloneSnapshot(currentSnapshot));
  persistSnapshot(currentSnapshot);
  emit();
}

export function undoHistory() {
  loadStorageIfNeeded();
  const previous = past[past.length - 1];
  if (!previous) return;

  future = [cloneSnapshot(currentSnapshot), ...future];
  past = past.slice(0, -1);
  currentSnapshot = cloneSnapshot(previous);
  persistSnapshot(currentSnapshot);
  emit();
}

export function redoHistory() {
  loadStorageIfNeeded();
  const next = future[0];
  if (!next) return;

  past = [...past, cloneSnapshot(currentSnapshot)];
  future = future.slice(1);
  currentSnapshot = cloneSnapshot(next);
  persistSnapshot(currentSnapshot);
  emit();
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
