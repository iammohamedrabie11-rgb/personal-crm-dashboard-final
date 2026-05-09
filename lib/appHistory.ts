"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import type { FinanceData } from "./financeStorage";
import { IncomeEntry, Lead } from "./types";

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

export interface HistorySyncStatus {
  source: "local" | "supabase";
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
}

// ─── Row shapes returned from Supabase ───────────────────────────────────────

interface LeadRow {
  id: string;
  user_id: string;
  client_name: string;
  niche: string;
  source_agency: string;
  status: string;
  deal_value: number;
  expected_commission: number;
  next_follow_up_date: string;
  notes: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface IncomeEntryRow {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  date: string;
  lead_id: string | null;
  notes: string;
  created_at: string;
}

interface FinanceAccountRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  notes: string;
}

interface FinanceExpenseRow {
  id: string;
  user_id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  account_id: string | null;
  status: string;
  notes: string;
}

interface FinanceBudgetRow {
  id: string;
  user_id: string;
  category: string;
  amount: number;
}

interface PlannedPaymentRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  account_id: string | null;
  status: string;
  notes: string;
}

// ─── Row ↔ domain mappers ────────────────────────────────────────────────────

function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    clientName: r.client_name,
    niche: r.niche,
    sourceAgency: r.source_agency as Lead["sourceAgency"],
    status: r.status as Lead["status"],
    dealValue: Number(r.deal_value),
    expectedCommission: Number(r.expected_commission),
    nextFollowUpDate: r.next_follow_up_date,
    notes: r.notes,
    phone: r.phone,
    email: r.email,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function leadToRow(lead: Lead, userId: string): Omit<LeadRow, "updated_at"> {
  return {
    id: lead.id,
    user_id: userId,
    client_name: lead.clientName,
    niche: lead.niche,
    source_agency: lead.sourceAgency,
    status: lead.status,
    deal_value: lead.dealValue,
    expected_commission: lead.expectedCommission,
    next_follow_up_date: lead.nextFollowUpDate,
    notes: lead.notes,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    created_at: lead.createdAt,
  };
}

function rowToIncomeEntry(r: IncomeEntryRow): IncomeEntry {
  return {
    id: r.id,
    source: r.source,
    amount: Number(r.amount),
    date: r.date,
    leadId: r.lead_id ?? undefined,
    notes: r.notes || undefined,
  };
}

function incomeEntryToRow(
  entry: IncomeEntry,
  userId: string
): Omit<IncomeEntryRow, "created_at"> {
  return {
    id: entry.id,
    user_id: userId,
    source: entry.source,
    amount: entry.amount,
    date: entry.date,
    lead_id: entry.leadId ?? null,
    notes: entry.notes ?? "",
  };
}

function rowToAccount(r: FinanceAccountRow): FinanceData["accounts"][number] {
  return {
    id: r.id,
    name: r.name,
    type: r.type as FinanceData["accounts"][number]["type"],
    balance: Number(r.balance),
    notes: r.notes,
  };
}

function accountToRow(
  account: FinanceData["accounts"][number],
  userId: string
): FinanceAccountRow {
  return {
    id: account.id,
    user_id: userId,
    name: account.name,
    type: account.type,
    balance: account.balance,
    notes: account.notes,
  };
}

function rowToExpense(r: FinanceExpenseRow): FinanceData["expenses"][number] {
  return {
    id: r.id,
    date: r.date,
    category: r.category as FinanceData["expenses"][number]["category"],
    description: r.description,
    amount: Number(r.amount),
    accountId: r.account_id ?? "",
    status: r.status as FinanceData["expenses"][number]["status"],
    notes: r.notes,
  };
}

function expenseToRow(
  expense: FinanceData["expenses"][number],
  userId: string
): FinanceExpenseRow {
  return {
    id: expense.id,
    user_id: userId,
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    account_id: expense.accountId || null,
    status: expense.status,
    notes: expense.notes,
  };
}

function rowToBudget(r: FinanceBudgetRow): FinanceData["budgets"][number] {
  return {
    id: r.id,
    category: r.category as FinanceData["budgets"][number]["category"],
    amount: Number(r.amount),
  };
}

function budgetToRow(
  budget: FinanceData["budgets"][number],
  userId: string
): FinanceBudgetRow {
  return {
    id: budget.id,
    user_id: userId,
    category: budget.category,
    amount: budget.amount,
  };
}

function rowToPayment(r: PlannedPaymentRow): FinanceData["plannedPayments"][number] {
  return {
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    dueDate: r.due_date,
    category: r.category as FinanceData["plannedPayments"][number]["category"],
    accountId: r.account_id ?? "",
    status: r.status as FinanceData["plannedPayments"][number]["status"],
    notes: r.notes,
  };
}

function paymentToRow(
  payment: FinanceData["plannedPayments"][number],
  userId: string
): PlannedPaymentRow {
  return {
    id: payment.id,
    user_id: userId,
    name: payment.name,
    amount: payment.amount,
    due_date: payment.dueDate,
    category: payment.category,
    account_id: payment.accountId || null,
    status: payment.status,
    notes: payment.notes,
  };
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const emptySnapshot: AppSnapshot = {
  crm: { leads: [], incomeEntries: [] },
  finance: { accounts: [], expenses: [], budgets: [], plannedPayments: [] },
};

// ─── Module state ─────────────────────────────────────────────────────────────

let currentSnapshot: AppSnapshot = cloneSnapshot(emptySnapshot);
let hasLoadedStorage = false;
let hasStartedSupabaseSync = false;
let activeUserId: string | null = null;
let activeUserSyncId = 0;
let lastSavedSnapshot: AppSnapshot | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let retrySaveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: AppSnapshot | null = null;
let isSaving = false;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cloneSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as AppSnapshot;
}

function serializeSnapshot(snapshot: AppSnapshot) {
  return JSON.stringify(snapshot);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLead(raw: unknown): Lead {
  const d = isRecord(raw) ? raw : {};
  return {
    id: String(d.id ?? ""),
    clientName: String(d.clientName ?? ""),
    niche: String(d.niche ?? ""),
    sourceAgency: (d.sourceAgency as Lead["sourceAgency"]) ?? "Personal",
    status: (d.status as Lead["status"]) ?? "New Lead",
    dealValue: Number(d.dealValue ?? 0),
    expectedCommission: Number(d.expectedCommission ?? 0),
    nextFollowUpDate: String(d.nextFollowUpDate ?? ""),
    notes: String(d.notes ?? ""),
    phone: String(d.phone ?? ""),
    email: String(d.email ?? ""),
    createdAt: String(d.createdAt ?? new Date().toISOString().split("T")[0]),
    updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
  };
}

function normalizeIncomeEntry(raw: unknown): IncomeEntry {
  const d = isRecord(raw) ? raw : {};
  return {
    id: String(d.id ?? ""),
    source: String(d.source ?? ""),
    amount: Number(d.amount ?? 0),
    date: String(d.date ?? ""),
    leadId: d.leadId ? String(d.leadId) : undefined,
    notes: d.notes ? String(d.notes) : undefined,
  };
}

function readLocalSnapshot(): AppSnapshot {
  if (typeof window === "undefined") return cloneSnapshot(emptySnapshot);
  try {
    const crmRaw = window.localStorage.getItem(CRM_STORAGE_KEY);
    const finRaw = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    const crm = crmRaw ? (JSON.parse(crmRaw) as unknown) : null;
    const fin = finRaw ? (JSON.parse(finRaw) as unknown) : null;
    const crmData = isRecord(crm) ? crm : {};
    const finData = isRecord(fin) ? fin : {};
    return {
      crm: {
        leads: Array.isArray(crmData.leads)
          ? (crmData.leads as unknown[]).map(normalizeLead)
          : [],
        incomeEntries: Array.isArray(crmData.incomeEntries)
          ? (crmData.incomeEntries as unknown[]).map(normalizeIncomeEntry)
          : [],
      },
      finance: {
        accounts: Array.isArray(finData.accounts)
          ? (finData.accounts as FinanceData["accounts"])
          : [],
        expenses: Array.isArray(finData.expenses)
          ? (finData.expenses as FinanceData["expenses"])
          : [],
        budgets: Array.isArray(finData.budgets)
          ? (finData.budgets as FinanceData["budgets"])
          : [],
        plannedPayments: Array.isArray(finData.plannedPayments)
          ? (finData.plannedPayments as FinanceData["plannedPayments"])
          : [],
      },
    };
  } catch {
    return cloneSnapshot(emptySnapshot);
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

function setSyncStatus(nextStatus: Partial<HistorySyncStatus>) {
  syncStatus = { ...syncStatus, ...nextStatus };
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
  currentSnapshot = updater(cloneSnapshot(currentSnapshot));
  persistSnapshot(currentSnapshot);
  emit();

  if (options.queueSave) {
    queueSupabaseSave(currentSnapshot);
  }
}

function applyQueuedInitialUpdates(options: { queueSave: boolean }) {
  const updaters = queuedInitialUpdaters;
  queuedInitialUpdaters = [];
  updaters.forEach((updater) => applyHistoryUpdate(updater, { queueSave: false }));
  if (options.queueSave && updaters.length > 0) {
    queueSupabaseSave(currentSnapshot);
  }
}

function replaceCurrentSnapshot(
  snapshot: AppSnapshot,
  options: { resetUndo: boolean }
) {
  currentSnapshot = cloneSnapshot(snapshot);
  persistSnapshot(currentSnapshot);
  lastSavedSnapshot = cloneSnapshot(snapshot);
  if (options.resetUndo) {
    past = [];
    future = [];
  }
  emit();
}

// ─── Supabase I/O ─────────────────────────────────────────────────────────────

async function fetchAllTables(userId: string): Promise<AppSnapshot> {
  const client = getSupabaseClient();

  const [leadsRes, incomeRes, accountsRes, expensesRes, budgetsRes, paymentsRes] =
    await Promise.all([
      client.from("leads").select("*").eq("user_id", userId),
      client.from("income_entries").select("*").eq("user_id", userId),
      client.from("finance_accounts").select("*").eq("user_id", userId),
      client.from("finance_expenses").select("*").eq("user_id", userId),
      client.from("finance_budgets").select("*").eq("user_id", userId),
      client.from("planned_payments").select("*").eq("user_id", userId),
    ]);

  if (leadsRes.error) throw leadsRes.error;
  if (incomeRes.error) throw incomeRes.error;
  if (accountsRes.error) throw accountsRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (budgetsRes.error) throw budgetsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return {
    crm: {
      leads: (leadsRes.data as LeadRow[]).map(rowToLead),
      incomeEntries: (incomeRes.data as IncomeEntryRow[]).map(rowToIncomeEntry),
    },
    finance: {
      accounts: (accountsRes.data as FinanceAccountRow[]).map(rowToAccount),
      expenses: (expensesRes.data as FinanceExpenseRow[]).map(rowToExpense),
      budgets: (budgetsRes.data as FinanceBudgetRow[]).map(rowToBudget),
      plannedPayments: (paymentsRes.data as PlannedPaymentRow[]).map(rowToPayment),
    },
  };
}

function diffArrays<T extends { id: string }>(
  oldItems: T[],
  newItems: T[]
): { inserts: T[]; updates: T[]; deletes: string[] } {
  const oldById = new Map(oldItems.map((item) => [item.id, item]));
  const newById = new Map(newItems.map((item) => [item.id, item]));

  const inserts = newItems.filter((item) => !oldById.has(item.id));
  const updates = newItems.filter((item) => {
    const old = oldById.get(item.id);
    return old !== undefined && JSON.stringify(old) !== JSON.stringify(item);
  });
  const deletes = oldItems
    .filter((item) => !newById.has(item.id))
    .map((item) => item.id);

  return { inserts, updates, deletes };
}

type SupabaseWriteOperation = PromiseLike<{
  error?: { message?: string } | null;
}>;

async function runSupabaseWrites(
  label: string,
  operations: SupabaseWriteOperation[]
) {
  if (operations.length === 0) return;

  const results = await Promise.all(
    operations.map((operation) => Promise.resolve(operation))
  );
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(
      `${label}: ${failed.error.message ?? "Supabase write failed."}`
    );
  }
}

async function diffAndSyncTables(
  userId: string,
  oldSnapshot: AppSnapshot,
  newSnapshot: AppSnapshot
): Promise<void> {
  const client = getSupabaseClient();

  const leadDiff = diffArrays(oldSnapshot.crm.leads, newSnapshot.crm.leads);
  const incomeDiff = diffArrays(
    oldSnapshot.crm.incomeEntries,
    newSnapshot.crm.incomeEntries
  );
  const accountDiff = diffArrays(
    oldSnapshot.finance.accounts,
    newSnapshot.finance.accounts
  );
  const expenseDiff = diffArrays(
    oldSnapshot.finance.expenses,
    newSnapshot.finance.expenses
  );
  const budgetDiff = diffArrays(
    oldSnapshot.finance.budgets,
    newSnapshot.finance.budgets
  );
  const paymentDiff = diffArrays(
    oldSnapshot.finance.plannedPayments,
    newSnapshot.finance.plannedPayments
  );

  const parentWrites: SupabaseWriteOperation[] = [];
  const childWrites: SupabaseWriteOperation[] = [];
  const parentDeletes: SupabaseWriteOperation[] = [];

  // leads
  if (leadDiff.inserts.length)
    parentWrites.push(
      client.from("leads").insert(leadDiff.inserts.map((l) => leadToRow(l, userId)))
    );
  for (const lead of leadDiff.updates)
    parentWrites.push(
      client
        .from("leads")
        .update(leadToRow(lead, userId))
        .eq("id", lead.id)
        .eq("user_id", userId)
    );
  for (const id of leadDiff.deletes)
    parentDeletes.push(client.from("leads").delete().eq("id", id).eq("user_id", userId));

  // income_entries
  if (incomeDiff.inserts.length)
    childWrites.push(
      client
        .from("income_entries")
        .insert(incomeDiff.inserts.map((e) => incomeEntryToRow(e, userId)))
    );
  for (const entry of incomeDiff.updates)
    childWrites.push(
      client
        .from("income_entries")
        .update(incomeEntryToRow(entry, userId))
        .eq("id", entry.id)
        .eq("user_id", userId)
    );
  for (const id of incomeDiff.deletes)
    childWrites.push(
      client.from("income_entries").delete().eq("id", id).eq("user_id", userId)
    );

  // finance_accounts (must go before expenses/payments due to FK)
  if (accountDiff.inserts.length)
    parentWrites.push(
      client
        .from("finance_accounts")
        .insert(accountDiff.inserts.map((a) => accountToRow(a, userId)))
    );
  for (const account of accountDiff.updates)
    parentWrites.push(
      client
        .from("finance_accounts")
        .update(accountToRow(account, userId))
        .eq("id", account.id)
        .eq("user_id", userId)
    );
  for (const id of accountDiff.deletes)
    parentDeletes.push(
      client
        .from("finance_accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
    );

  // finance_expenses
  if (expenseDiff.inserts.length)
    childWrites.push(
      client
        .from("finance_expenses")
        .insert(expenseDiff.inserts.map((e) => expenseToRow(e, userId)))
    );
  for (const expense of expenseDiff.updates)
    childWrites.push(
      client
        .from("finance_expenses")
        .update(expenseToRow(expense, userId))
        .eq("id", expense.id)
        .eq("user_id", userId)
    );
  for (const id of expenseDiff.deletes)
    childWrites.push(
      client
        .from("finance_expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
    );

  // finance_budgets
  if (budgetDiff.inserts.length)
    childWrites.push(
      client
        .from("finance_budgets")
        .insert(budgetDiff.inserts.map((b) => budgetToRow(b, userId)))
    );
  for (const budget of budgetDiff.updates)
    childWrites.push(
      client
        .from("finance_budgets")
        .update(budgetToRow(budget, userId))
        .eq("id", budget.id)
        .eq("user_id", userId)
    );
  for (const id of budgetDiff.deletes)
    childWrites.push(
      client
        .from("finance_budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
    );

  // planned_payments
  if (paymentDiff.inserts.length)
    childWrites.push(
      client
        .from("planned_payments")
        .insert(paymentDiff.inserts.map((p) => paymentToRow(p, userId)))
    );
  for (const payment of paymentDiff.updates)
    childWrites.push(
      client
        .from("planned_payments")
        .update(paymentToRow(payment, userId))
        .eq("id", payment.id)
        .eq("user_id", userId)
    );
  for (const id of paymentDiff.deletes)
    childWrites.push(
      client
        .from("planned_payments")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
    );

  await runSupabaseWrites("Parent row writes", parentWrites);
  await runSupabaseWrites("Dependent row writes", childWrites);
  await runSupabaseWrites("Parent row deletes", parentDeletes);
}

// ─── One-time migration from app_snapshots JSONB ─────────────────────────────

function generateMigrationIds(snapshot: AppSnapshot): AppSnapshot {
  // Old string IDs (e.g. "lead-001") aren't valid UUIDs. Remap everything
  // to crypto.randomUUID() and fix cross-references.
  const leadIdMap = new Map<string, string>();
  const accountIdMap = new Map<string, string>();

  const leads = snapshot.crm.leads.map((lead) => {
    const newId = crypto.randomUUID();
    leadIdMap.set(lead.id, newId);
    return { ...lead, id: newId };
  });

  const incomeEntries = snapshot.crm.incomeEntries.map((entry) => ({
    ...entry,
    id: crypto.randomUUID(),
    leadId: entry.leadId ? (leadIdMap.get(entry.leadId) ?? undefined) : undefined,
  }));

  const accounts = snapshot.finance.accounts.map((account) => {
    const newId = crypto.randomUUID();
    accountIdMap.set(account.id, newId);
    return { ...account, id: newId };
  });

  const expenses = snapshot.finance.expenses.map((expense) => ({
    ...expense,
    id: crypto.randomUUID(),
    accountId: expense.accountId
      ? (accountIdMap.get(expense.accountId) ?? "")
      : "",
  }));

  const budgets = snapshot.finance.budgets.map((budget) => ({
    ...budget,
    id: crypto.randomUUID(),
  }));

  const plannedPayments = snapshot.finance.plannedPayments.map((payment) => ({
    ...payment,
    id: crypto.randomUUID(),
    accountId: payment.accountId
      ? (accountIdMap.get(payment.accountId) ?? "")
      : "",
  }));

  return {
    crm: { leads, incomeEntries },
    finance: { accounts, expenses, budgets, plannedPayments },
  };
}

async function migrateFromAppSnapshots(userId: string): Promise<AppSnapshot | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("app_snapshots")
    .select("crm, finance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const crm = isRecord(data.crm) ? data.crm : {};
  const fin = isRecord(data.finance) ? data.finance : {};

  const oldSnapshot: AppSnapshot = {
    crm: {
      leads: Array.isArray(crm.leads)
        ? (crm.leads as unknown[]).map(normalizeLead)
        : [],
      incomeEntries: Array.isArray(crm.incomeEntries)
        ? (crm.incomeEntries as unknown[]).map(normalizeIncomeEntry)
        : [],
    },
    finance: {
      accounts: Array.isArray(fin.accounts)
        ? (fin.accounts as FinanceData["accounts"])
        : [],
      expenses: Array.isArray(fin.expenses)
        ? (fin.expenses as FinanceData["expenses"])
        : [],
      budgets: Array.isArray(fin.budgets)
        ? (fin.budgets as FinanceData["budgets"])
        : [],
      plannedPayments: Array.isArray(fin.plannedPayments)
        ? (fin.plannedPayments as FinanceData["plannedPayments"])
        : [],
    },
  };

  // Remap all IDs to valid UUIDs before inserting into the new tables
  const remapped = generateMigrationIds(oldSnapshot);
  await diffAndSyncTables(userId, emptySnapshot, remapped);
  return remapped;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

function stopRealtime() {
  if (realtimeChannel && supabaseClient) {
    void supabaseClient.removeChannel(realtimeChannel);
  }
  realtimeChannel = null;
}

function subscribeToRemoteChanges(userId: string) {
  const client = getSupabaseClient();
  stopRealtime();

  const tables = [
    "leads",
    "income_entries",
    "finance_accounts",
    "finance_expenses",
    "finance_budgets",
    "planned_payments",
  ];

  let channel = client.channel(`user-data-${userId}`);

  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `user_id=eq.${userId}`,
      },
      () => {
        if (!isSaving && !pendingSnapshot) {
          void refreshFromSupabase();
        }
      }
    );
  }

  realtimeChannel = channel.subscribe();
}

function stopRefreshInterval() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

function startRefreshInterval() {
  stopRefreshInterval();
  refreshInterval = setInterval(() => void refreshFromSupabase(), REFRESH_INTERVAL_MS);
}

function installRefreshListeners() {
  if (typeof window === "undefined" || hasInstalledRefreshListeners) return;
  hasInstalledRefreshListeners = true;

  window.addEventListener("focus", () => void refreshFromSupabase());
  window.addEventListener("online", () => {
    void refreshFromSupabase();
    void flushSupabaseSave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshFromSupabase();
  });
}

async function refreshFromSupabase() {
  if (!activeUserId || syncStatus.isLoading || isSaving || pendingSnapshot) return;

  try {
    const snapshot = await fetchAllTables(activeUserId);
    const newJson = serializeSnapshot(snapshot);
    if (newJson !== serializeSnapshot(currentSnapshot)) {
      replaceCurrentSnapshot(snapshot, { resetUndo: true });
    }
    setSyncStatus({ source: "supabase", lastError: null });
  } catch (error) {
    setSyncStatus({
      source: "local",
      lastError: error instanceof Error ? error.message : "Could not refresh app data.",
    });
  }
}

// ─── Save queue ───────────────────────────────────────────────────────────────

function clearRetrySaveTimeout() {
  if (retrySaveTimeout) {
    clearTimeout(retrySaveTimeout);
    retrySaveTimeout = null;
  }
}

function queueSupabaseSave(snapshot: AppSnapshot) {
  if (!activeUserId) return;
  pendingSnapshot = cloneSnapshot(snapshot);
  void flushSupabaseSave();
}

async function flushSupabaseSave() {
  if (!activeUserId || isSaving) return;

  clearRetrySaveTimeout();
  isSaving = true;
  setSyncStatus({ isSaving: true });

  while (activeUserId && pendingSnapshot) {
    const snapshotToSave = pendingSnapshot;
    pendingSnapshot = null;
    const baseline = lastSavedSnapshot ?? emptySnapshot;

    try {
      await diffAndSyncTables(activeUserId, baseline, snapshotToSave);
      lastSavedSnapshot = cloneSnapshot(snapshotToSave);
      setSyncStatus({ source: "supabase", lastError: null });
    } catch (error) {
      pendingSnapshot = snapshotToSave;
      setSyncStatus({
        source: "local",
        lastError: error instanceof Error ? error.message : "Could not save app data.",
      });
      retrySaveTimeout = setTimeout(() => void flushSupabaseSave(), RETRY_SAVE_MS);
      break;
    }
  }

  isSaving = false;
  setSyncStatus({ isSaving: false });
}

// ─── Auth lifecycle ───────────────────────────────────────────────────────────

function handleSignedOut() {
  activeUserId = null;
  activeUserSyncId += 1;
  stopRealtime();
  stopRefreshInterval();
  clearRetrySaveTimeout();
  pendingSnapshot = null;
  isSaving = false;
  lastSavedSnapshot = null;
  past = [];
  future = [];
  applyQueuedInitialUpdates({ queueSave: false });
  setSyncStatus({ source: "local", isLoading: false, isSaving: false, lastError: null });
}

async function syncUserSnapshot(userId: string, syncId: number) {
  setSyncStatus({ source: "local", isLoading: true, lastError: null });

  try {
    const remote = await fetchAllTables(userId);
    if (syncId !== activeUserSyncId) return;

    const isEmpty =
      remote.crm.leads.length === 0 &&
      remote.crm.incomeEntries.length === 0 &&
      remote.finance.accounts.length === 0 &&
      remote.finance.expenses.length === 0 &&
      remote.finance.budgets.length === 0 &&
      remote.finance.plannedPayments.length === 0;

    if (isEmpty) {
      // Try to migrate from old app_snapshots table
      const migrated = await migrateFromAppSnapshots(userId);
      if (syncId !== activeUserSyncId) return;

      if (migrated) {
        replaceCurrentSnapshot(migrated, { resetUndo: true });
      } else {
        // Genuinely new user — start fresh
        replaceCurrentSnapshot(emptySnapshot, { resetUndo: true });
      }
    } else {
      replaceCurrentSnapshot(remote, { resetUndo: true });
    }

    applyQueuedInitialUpdates({ queueSave: true });
    subscribeToRemoteChanges(userId);
    startRefreshInterval();
    setSyncStatus({ source: "supabase", isLoading: false, isSaving: false, lastError: null });
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

function handleSignedIn(userId: string) {
  if (activeUserId === userId && syncStatus.source === "supabase") return;
  if (activeUserId === userId && syncStatus.isLoading) return;

  activeUserId = userId;
  activeUserSyncId += 1;
  stopRealtime();
  stopRefreshInterval();
  clearRetrySaveTimeout();
  pendingSnapshot = null;
  isSaving = false;
  lastSavedSnapshot = null;

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
          lastError:
            error instanceof Error ? error.message : "Could not start app sync.",
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
      lastError:
        error instanceof Error ? error.message : "Could not start app sync.",
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  loadStorageIfNeeded();
  startSupabaseSync();
  listener();
  return () => { listeners.delete(listener); };
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

export function createId(): string {
  return crypto.randomUUID();
}
