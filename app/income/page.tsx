"use client";

import { FormEvent, useState } from "react";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { incomeSources, useCrmData } from "@/lib/crmStorage";
import { IncomeEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type IncomeSource = (typeof incomeSources)[number];
type IncomeFormState = Omit<IncomeEntry, "id" | "amount"> & {
  amount: string;
};

const today = new Date().toISOString().split("T")[0];
const fixedSourceAmounts: Partial<Record<IncomeSource, number>> = {
  "Pocket money": 6000,
  "Sales Agent - Domya (Basic)": 6000,
  "Sales Agent - Krijo (Basic)": 10000,
};

const emptyIncomeForm: IncomeFormState = {
  source: "Freelance",
  amount: "",
  date: today,
  leadId: "",
  notes: "",
};

export default function IncomePage() {
  const {
    leads,
    incomeEntries,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
  } = useCrmData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<IncomeEntry | null>(null);
  const [form, setForm] = useState<IncomeFormState>(emptyIncomeForm);

  const todayDate = new Date();
  const thisMonth = todayDate.getMonth();
  const thisYear = todayDate.getFullYear();

  const incomeBySource = incomeEntries.reduce(
    (acc, entry) => {
      const existing = acc.find((item) => item.source === entry.source);
      if (existing) {
        existing.total += entry.amount;
        existing.count += 1;
      } else {
        acc.push({ source: entry.source, total: entry.amount, count: 1 });
      }
      return acc;
    },
    [] as Array<{ source: string; total: number; count: number }>
  );

  const thisMonthEntries = incomeEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
  });

  const monthlyBySource = thisMonthEntries.reduce(
    (acc, entry) => {
      const existing = acc.find((item) => item.source === entry.source);
      if (existing) {
        existing.total += entry.amount;
        existing.count += 1;
      } else {
        acc.push({ source: entry.source, total: entry.amount, count: 1 });
      }
      return acc;
    },
    [] as Array<{ source: string; total: number; count: number }>
  );

  const monthlyIncome = thisMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const totalCommissions = incomeEntries
    .filter((entry) => entry.source === "Commission")
    .reduce((sum, entry) => sum + entry.amount, 0);

  function openNewIncomeForm() {
    setEditingEntry(null);
    setForm(emptyIncomeForm);
    setIsFormOpen(true);
  }

  function openEditIncomeForm(entry: IncomeEntry) {
    setEditingEntry(entry);
    setForm({
      source: incomeSources.includes(entry.source as IncomeSource)
        ? entry.source
        : "Other",
      amount: String(entry.amount),
      date: entry.date,
      leadId: entry.leadId ?? "",
      notes: entry.notes ?? "",
    });
    setIsFormOpen(true);
  }

  function saveIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEntry = {
      ...form,
      source: form.source.trim() || "Other",
      amount: Number(form.amount) || 0,
      leadId: form.leadId || undefined,
      notes: form.notes?.trim(),
    };

    if (editingEntry) {
      updateIncomeEntry({ ...editingEntry, ...normalizedEntry });
    } else {
      addIncomeEntry(normalizedEntry);
    }

    setEditingEntry(null);
    setForm(emptyIncomeForm);
    setIsFormOpen(false);
  }

  function updateSource(source: IncomeSource) {
    const fixedAmount = fixedSourceAmounts[source];
    setForm({
      ...form,
      source,
      amount: fixedAmount === undefined ? "" : String(fixedAmount),
    });
  }

  function removeIncomeEntry(entry: IncomeEntry) {
    setEntryToDelete(entry);
  }

  function confirmIncomeDeletion() {
    if (!entryToDelete) return;
    deleteIncomeEntry(entryToDelete.id);
    setEntryToDelete(null);
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold text-white">Income</h1>
            <p className="text-sm text-slate-400">Track and analyze your income sources</p>
          </div>
          <button
            type="button"
            onClick={openNewIncomeForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Add income source
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={saveIncome}
            className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {editingEntry ? "Edit income source" : "Add income source"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Source
                <select
                  required
                  value={form.source}
                  onChange={(event) => updateSource(event.target.value as IncomeSource)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  {incomeSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Related lead
                <select
                  value={form.leadId}
                  onChange={(event) => setForm({ ...form, leadId: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">None</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.clientName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">
                Description
                <input
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Save income
              </button>
            </div>
          </form>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Monthly Income" value={formatCurrency(monthlyIncome)} tone="emerald" />
          <SummaryCard label="Total Income" value={formatCurrency(totalIncome)} />
          <SummaryCard
            label="Total Commissions"
            value={formatCurrency(totalCommissions)}
            tone="amber"
          />
          <SummaryCard label="Transactions" value={incomeEntries.length} tone="blue" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
            <h2 className="mb-5 text-lg font-semibold text-white">Income by Source</h2>
            <div className="space-y-3">
              {incomeBySource
                .sort((a, b) => b.total - a.total)
                .map((item) => (
                  <div
                    key={item.source}
                    className="flex items-center justify-between gap-4 rounded-lg bg-slate-700/20 p-3 transition-colors hover:bg-slate-700/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-white">{item.source}</p>
                      <p className="text-xs text-slate-400">
                        {item.count} transaction{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="break-words text-right text-sm font-bold text-white">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
            <h2 className="mb-5 text-lg font-semibold text-white">This Month by Source</h2>
            <div className="space-y-2 text-xs">
              {monthlyBySource.length > 0 ? (
                monthlyBySource
                  .sort((a, b) => b.total - a.total)
                  .map((item) => (
                    <div
                      key={item.source}
                      className="flex justify-between gap-4 rounded-lg bg-slate-700/20 p-3"
                    >
                      <span className="break-words text-slate-300">{item.source}</span>
                      <span className="break-words text-right font-bold text-white">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="rounded-lg bg-slate-700/20 p-3 text-slate-400">
                  No income entries yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
          <h2 className="mb-5 text-lg font-semibold text-white">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">Source</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">Description</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">Amount</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...incomeEntries]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => {
                    const lead = entry.leadId
                      ? leads.find((leadItem) => leadItem.id === entry.leadId)
                      : null;

                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-slate-700/30 transition-colors hover:bg-slate-700/20"
                      >
                        <td className="px-3 py-2.5 text-slate-400">{formatDate(entry.date)}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-white">
                          {entry.source}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">
                          {entry.notes}
                          {lead && <div className="mt-0.5 text-slate-500">{lead.clientName}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditIncomeForm(entry)}
                              className="rounded-md bg-slate-700 px-2 py-1 font-medium text-slate-100 hover:bg-slate-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeIncomeEntry(entry)}
                              className="rounded-md bg-rose-950 px-2 py-1 font-medium text-rose-200 hover:bg-rose-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={Boolean(entryToDelete)}
        message={
          entryToDelete
            ? `Are you sure you want to delete this ${entryToDelete.source} income entry?`
            : ""
        }
        onCancel={() => setEntryToDelete(null)}
        onConfirm={confirmIncomeDeletion}
      />
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: string | number;
  tone?: "white" | "emerald" | "amber" | "blue";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 break-words text-xl font-bold leading-tight sm:text-2xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
