"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { dummyIncomeEntries, dummyLeads } from "./dummyData";
import { createClient } from "./supabase/client";
import { IncomeEntry, Lead } from "./types";
import type { FinanceData } from "./financeStorage";

const CRM_STORAGE_KEY = "personal-crm-dashboard-data-v1";
const FINANCE_STORAGE_KEY = "personal-crm-dashboard-finance-v1";
const REFRESH_INTERVAL_MS = 30_000;
const RETRY_SAVE_MS = 5_000;

interface CrmData {
  leads: Lead[];
  incomeEntries: IncomeEntry[];
}

export interface AppSnapshot {
  crm: CrmData;
  finance: FinanceData;
}

interface SnapshotRow {
  crm: unknown;
  finance: unknown;
  updated_at: string | null;
}

export interface HistorySyncStatus {
  source: "local" | "supabase";
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
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

let currentSnapshot: AppSnapshot = getDefaultSnapshot();
let hasLoadedStorage = false;
let hasStartedSupabaseSync = false;
let activeUserId: string | null = null;
let activeUserSyncId = 0;
let lastRemoteUpdatedAt: string | null = null;
let lastSavedSnapshotJson: string | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let retrySaveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSupabaseSnapshot: AppSnapshot | null = null;
let isSavingSupabaseSnapshot = false;
let supabaseClient: ReturnType<typeof createClient> | null = null;
let hasInstalledRefreshListeners = false;
let past: AppSnapshot[] = [];
let future: AppSnapshot[] = [];
let queuedInitialUpdaters: Array<(snapshot: AppSnapshot) => AppSnapshot> = [];
let syncStatus: HistorySyncStatus = {
  source: "local",
  isLoading: false,
  isSaving: false,
  lastError: null,
};

const listeners = new Set<() => void>();

function cloneSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as AppSnapshot;
}

function getDefaultSnapshot(): AppSnapshot {
  return cloneSnapshot({
    crm: defaultCrmData,
    finance: defaultFinanceData,
  });
}

function serializeSnapshot(snapshot: AppSnapshot) {
  return JSON.stringify(snapshot);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCrmData(value: unknown): CrmData {
  const data = isRecord(value) ? value : {};
  const defaults = getDefaultSnapshot().crm;

  return {
    leads: Array.isArray(data.leads) ? (data.leads as Lead[]) : defaults.leads,
    incomeEntries: Array.isArray(data.incomeEntries)
      ? (data.incomeEntries as IncomeEntry[])
      : defaults.incomeEntries,
  };
}

function normalizeFinanceData(value: unknown): FinanceData {
  const data = isRecord(value) ? value : {};
  const defaults = getDefaultSnapshot().finance;

  return {
    accounts: Array.isArray(data.accounts)
      ? (data.accounts as FinanceData["accounts"])
      : defaults.accounts,
    expenses: Array.isArray(data.expenses)
      ? (data.expenses as FinanceData["expenses"])
      : defaults.expenses,
    budgets: Array.isArray(data.budgets)
      ? (data.budgets as FinanceData["budgets"])
      : defaults.budgets,
    plannedPayments: Array.isArray(data.plannedPayments)
      ? (data.plannedPayments as FinanceData["plannedPayments"])
      : defaults.plannedPayments,
  };
}

function normalizeSnapshot(crm: unknown, finance: unknown): AppSnapshot {
  return {
    crm: normalizeCrmData(crm),
    finance: normalizeFinanceData(finance),
  };
}

function readCrmData(): CrmData {
  if (typeof window === "undefined") return getDefaultSnapshot().crm;

  try {
    const stored = window.localStorage.getItem(CRM_STORAGE_KEY);
    if (!stored) return getDefaultSnapshot().crm;
    return normalizeCrmData(JSON.parse(stored) as unknown);
  } catch {
    return getDefaultSnapshot().crm;
  }
}

function readFinanceData(): FinanceData {
  if (typeof window === "undefined") return getDefaultSnapshot().finance;

  try {
    const stored = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!stored) return getDefaultSnapshot().finance;
    return normalizeFinanceData(JSON.parse(stored) as unknown);
  } catch {
    return getDefaultSnapshot().finance;
  }
}

function readLocalSnapshot(): AppSnapshot {
  return {
    crm: readCrmData(),
    finance: readFinanceData(),
  };
}

function persistSnapshot(snapshot: AppSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(snapshot.crm));
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(snapshot.finance));
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setSyncStatus(nextStatus: Partial<HistorySyncStatus>) {
  syncStatus = {
    ...syncStatus,
    ...nextStatus,
  };
  emit();
}

function loadStorageIfNeeded() {
  if (hasLoadedStorage || typeof window === "undefined") return;
  currentSnapshot = readLocalSnapshot();
  hasLoadedStorage = true;
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  supabaseClient = createClient();
  return supabaseClient;
}

function isInitialSupabaseLoadPending() {
  return hasStartedSupabaseSync && syncStatus.isLoading;
}

function applyHistoryUpdate(
  updater: (snapshot: AppSnapshot) => AppSnapshot,
  options: { queueSave: boolean } = { queueSave: true }
) {
  past = [...past, cloneSnapshot(currentSnapshot)];
  future = [];
  const updatedSnapshot = updater(cloneSnapshot(currentSnapshot));
  currentSnapshot = normalizeSnapshot(updatedSnapshot.crm, updatedSnapshot.finance);
  persistSnapshot(currentSnapshot);
  emit();

  if (options.queueSave) {
    queueSupabaseSave(currentSnapshot);
  }
}

function applyQueuedInitialUpdates(options: { queueSave: boolean }) {
  const updaters = queuedInitialUpdaters;
  queuedInitialUpdaters = [];

  updaters.forEach((updater) => {
    applyHistoryUpdate(updater, { queueSave: false });
  });

  if (options.queueSave && updaters.length > 0) {
    queueSupabaseSave(currentSnapshot);
  }
}

function replaceCurrentSnapshot(
  snapshot: AppSnapshot,
  options: { resetUndo: boolean; remoteUpdatedAt?: string | null }
) {
  currentSnapshot = cloneSnapshot(snapshot);
  persistSnapshot(currentSnapshot);
  lastSavedSnapshotJson = serializeSnapshot(currentSnapshot);
  lastRemoteUpdatedAt = options.remoteUpdatedAt ?? lastRemoteUpdatedAt;

  if (options.resetUndo) {
    past = [];
    future = [];
  }

  emit();
}

function stopRealtime() {
  if (realtimeChannel && supabaseClient) {
    void supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = null;
}

function stopRefreshInterval() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

function clearRetrySaveTimeout() {
  if (retrySaveTimeout) {
    clearTimeout(retrySaveTimeout);
    retrySaveTimeout = null;
  }
}

function subscribeToRemoteChanges(userId: string) {
  const client = getSupabaseClient();
  stopRealtime();

  realtimeChannel = client
    .channel(`app-snapshots-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_snapshots",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as SnapshotRow;
        applyRemoteSnapshot(row);
      }
    )
    .subscribe();
}

function startRefreshInterval() {
  stopRefreshInterval();
  refreshInterval = setInterval(() => {
    void refreshFromSupabase();
  }, REFRESH_INTERVAL_MS);
}

function installRefreshListeners() {
  if (typeof window === "undefined") return;
  if (hasInstalledRefreshListeners) return;

  hasInstalledRefreshListeners = true;

  window.addEventListener("focus", () => {
    void refreshFromSupabase();
  });

  window.addEventListener("online", () => {
    void refreshFromSupabase();
    void flushSupabaseSave();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshFromSupabase();
    }
  });
}

function applyRemoteSnapshot(row: SnapshotRow) {
  if (isSavingSupabaseSnapshot || pendingSupabaseSnapshot) return;

  if (
    row.updated_at &&
    lastRemoteUpdatedAt &&
    Date.parse(row.updated_at) < Date.parse(lastRemoteUpdatedAt)
  ) {
    return;
  }

  const remoteSnapshot = normalizeSnapshot(row.crm, row.finance);
  const remoteSnapshotJson = serializeSnapshot(remoteSnapshot);

  lastRemoteUpdatedAt = row.updated_at;
  lastSavedSnapshotJson = remoteSnapshotJson;

  if (remoteSnapshotJson === serializeSnapshot(currentSnapshot)) return;

  replaceCurrentSnapshot(remoteSnapshot, {
    resetUndo: true,
    remoteUpdatedAt: row.updated_at,
  });
}

async function fetchSnapshotRow(userId: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("app_snapshots")
    .select("crm, finance, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as SnapshotRow | null;
}

async function upsertSnapshotRow(userId: string, snapshot: AppSnapshot) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("app_snapshots")
    .upsert(
      {
        user_id: userId,
        crm: snapshot.crm,
        finance: snapshot.finance,
      },
      { onConflict: "user_id" }
    )
    .select("crm, finance, updated_at")
    .single();

  if (error) throw error;
  return data as SnapshotRow;
}

async function syncUserSnapshot(userId: string, syncId: number) {
  setSyncStatus({
    source: "local",
    isLoading: true,
    lastError: null,
  });

  try {
    const row = await fetchSnapshotRow(userId);
    if (syncId !== activeUserSyncId) return;

    if (row) {
      const remoteSnapshot = normalizeSnapshot(row.crm, row.finance);
      replaceCurrentSnapshot(remoteSnapshot, {
        resetUndo: true,
        remoteUpdatedAt: row.updated_at,
      });
      applyQueuedInitialUpdates({ queueSave: true });
    } else {
      currentSnapshot = readLocalSnapshot();
      applyQueuedInitialUpdates({ queueSave: false });
      persistSnapshot(currentSnapshot);
      const createdRow = await upsertSnapshotRow(userId, currentSnapshot);
      if (syncId !== activeUserSyncId) return;
      lastSavedSnapshotJson = serializeSnapshot(currentSnapshot);
      lastRemoteUpdatedAt = createdRow.updated_at;
      emit();
    }

    subscribeToRemoteChanges(userId);
    startRefreshInterval();
    setSyncStatus({
      source: "supabase",
      isLoading: false,
      isSaving: false,
      lastError: null,
    });
  } catch (error) {
    if (syncId !== activeUserSyncId) return;
    applyQueuedInitialUpdates({ queueSave: false });
    setSyncStatus({
      source: "local",
      isLoading: false,
      lastError: error instanceof Error ? error.message : "Could not sync app data.",
    });
    queueSupabaseSave(currentSnapshot);
  }
}

function handleSignedOut() {
  activeUserId = null;
  activeUserSyncId += 1;
  stopRealtime();
  stopRefreshInterval();
  clearRetrySaveTimeout();
  pendingSupabaseSnapshot = null;
  isSavingSupabaseSnapshot = false;
  lastRemoteUpdatedAt = null;
  lastSavedSnapshotJson = null;
  past = [];
  future = [];
  applyQueuedInitialUpdates({ queueSave: false });
  setSyncStatus({
    source: "local",
    isLoading: false,
    isSaving: false,
    lastError: null,
  });
}

function handleSignedIn(userId: string) {
  if (activeUserId === userId && syncStatus.source === "supabase") return;
  if (activeUserId === userId && syncStatus.isLoading) return;

  activeUserId = userId;
  activeUserSyncId += 1;
  stopRealtime();
  stopRefreshInterval();
  clearRetrySaveTimeout();
  pendingSupabaseSnapshot = null;
  isSavingSupabaseSnapshot = false;
  lastRemoteUpdatedAt = null;
  lastSavedSnapshotJson = null;

  void syncUserSnapshot(userId, activeUserSyncId);
}

function startSupabaseSync() {
  if (hasStartedSupabaseSync || typeof window === "undefined") return;

  hasStartedSupabaseSync = true;
  installRefreshListeners();
  setSyncStatus({ isLoading: true, lastError: null });

  try {
    const client = getSupabaseClient();

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        const userId = data.session?.user.id ?? null;
        if (userId) handleSignedIn(userId);
        else handleSignedOut();
      })
      .catch((error: unknown) => {
        applyQueuedInitialUpdates({ queueSave: false });
        setSyncStatus({
          source: "local",
          isLoading: false,
          lastError: error instanceof Error ? error.message : "Could not start app sync.",
        });
      });

    client.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (userId) handleSignedIn(userId);
      else handleSignedOut();
    });
  } catch (error) {
    applyQueuedInitialUpdates({ queueSave: false });
    setSyncStatus({
      source: "local",
      isLoading: false,
      lastError: error instanceof Error ? error.message : "Could not start app sync.",
    });
  }
}

function queueSupabaseSave(snapshot: AppSnapshot) {
  if (!activeUserId) return;

  const snapshotJson = serializeSnapshot(snapshot);
  if (snapshotJson === lastSavedSnapshotJson && !pendingSupabaseSnapshot) return;

  pendingSupabaseSnapshot = cloneSnapshot(snapshot);
  void flushSupabaseSave();
}

async function flushSupabaseSave() {
  if (!activeUserId || isSavingSupabaseSnapshot) return;

  clearRetrySaveTimeout();
  isSavingSupabaseSnapshot = true;
  setSyncStatus({ isSaving: true });

  while (activeUserId && pendingSupabaseSnapshot) {
    const snapshotToSave = pendingSupabaseSnapshot;
    pendingSupabaseSnapshot = null;

    try {
      const row = await upsertSnapshotRow(activeUserId, snapshotToSave);
      const savedSnapshot = normalizeSnapshot(row.crm, row.finance);
      lastSavedSnapshotJson = serializeSnapshot(savedSnapshot);
      lastRemoteUpdatedAt = row.updated_at;
      setSyncStatus({
        source: "supabase",
        lastError: null,
      });
    } catch (error) {
      pendingSupabaseSnapshot = snapshotToSave;
      setSyncStatus({
        source: "local",
        lastError: error instanceof Error ? error.message : "Could not save app data.",
      });
      retrySaveTimeout = setTimeout(() => {
        void flushSupabaseSave();
      }, RETRY_SAVE_MS);
      break;
    }
  }

  isSavingSupabaseSnapshot = false;
  setSyncStatus({ isSaving: false });
}

async function refreshFromSupabase() {
  if (
    !activeUserId ||
    syncStatus.isLoading ||
    isSavingSupabaseSnapshot ||
    pendingSupabaseSnapshot
  ) {
    return;
  }

  try {
    const row = await fetchSnapshotRow(activeUserId);
    if (!row) return;
    applyRemoteSnapshot(row);
    setSyncStatus({
      source: "supabase",
      lastError: null,
    });
  } catch (error) {
    setSyncStatus({
      source: "local",
      lastError: error instanceof Error ? error.message : "Could not refresh app data.",
    });
  }
}

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  loadStorageIfNeeded();
  startSupabaseSync();
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
    canUndo: past.length > 0 && !syncStatus.isLoading,
    canRedo: future.length > 0 && !syncStatus.isLoading,
  };
}

export function getHistorySyncStatus() {
  return syncStatus;
}

export function updateHistory(updater: (snapshot: AppSnapshot) => AppSnapshot) {
  loadStorageIfNeeded();
  startSupabaseSync();

  if (isInitialSupabaseLoadPending()) {
    queuedInitialUpdaters = [...queuedInitialUpdaters, updater];
    return;
  }

  applyHistoryUpdate(updater);
}

export function undoHistory() {
  loadStorageIfNeeded();
  startSupabaseSync();
  if (syncStatus.isLoading) return;

  const previous = past[past.length - 1];
  if (!previous) return;

  future = [cloneSnapshot(currentSnapshot), ...future];
  past = past.slice(0, -1);
  currentSnapshot = cloneSnapshot(previous);
  persistSnapshot(currentSnapshot);
  queueSupabaseSave(currentSnapshot);
  emit();
}

export function redoHistory() {
  loadStorageIfNeeded();
  startSupabaseSync();
  if (syncStatus.isLoading) return;

  const next = future[0];
  if (!next) return;

  past = [...past, cloneSnapshot(currentSnapshot)];
  future = future.slice(1);
  currentSnapshot = cloneSnapshot(next);
  persistSnapshot(currentSnapshot);
  queueSupabaseSave(currentSnapshot);
  emit();
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
