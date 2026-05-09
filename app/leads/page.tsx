"use client";

import { FormEvent, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { KanbanView } from "@/components/KanbanView";
import { LeadsTable } from "@/components/LeadsTable";
import { SuggestMessageModal } from "@/components/SuggestMessageModal";
import { agencies, leadStatuses, useCrmData } from "@/lib/crmStorage";
import { calculateCommission, useCommissionRules } from "@/lib/commissionRules";
import { Agency, Lead, LeadStatus } from "@/lib/types";
import { formatCurrency, getAgencyColor, getStatusColor } from "@/lib/utils";

type LeadFormState = Omit<Lead, "id" | "createdAt" | "updatedAt">;

const today = new Date().toISOString().split("T")[0];

const emptyLeadForm: LeadFormState = {
  clientName: "",
  niche: "",
  sourceAgency: "Personal",
  status: "New Lead",
  dealValue: 0,
  expectedCommission: 0,
  nextFollowUpDate: today,
  notes: "",
  phone: "",
  email: "",
};

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useCrmData();
  const { rules } = useCommissionRules();
  const [view, setView] = useState<"table" | "kanban">(() => {
    if (typeof window === "undefined") return "table";
    return (localStorage.getItem("crm-leads-view") as "table" | "kanban") ?? "table";
  });
  const [suggestingLead, setSuggestingLead] = useState<Lead | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);

  const statuses = useMemo(() => Array.from(new Set(leads.map((lead) => lead.status))), [leads]);
  const leadAgencies = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.sourceAgency))),
    [leads]
  );

  let filteredLeads = leads;

  if (selectedStatus) {
    filteredLeads = filteredLeads.filter((lead) => lead.status === selectedStatus);
  }

  if (selectedAgency) {
    filteredLeads = filteredLeads.filter((lead) => lead.sourceAgency === selectedAgency);
  }

  function switchView(next: "table" | "kanban") {
    setView(next);
    localStorage.setItem("crm-leads-view", next);
  }

  function moveLead(lead: Lead, newStatus: LeadStatus) {
    updateLead({ ...lead, status: newStatus });
  }

  function openNewLeadForm() {
    setEditingLead(null);
    setForm(emptyLeadForm);
    setIsFormOpen(true);
  }

  function openEditLeadForm(lead: Lead) {
    setEditingLead(lead);
    setForm({
      clientName: lead.clientName,
      niche: lead.niche,
      sourceAgency: lead.sourceAgency,
      status: lead.status,
      dealValue: lead.dealValue,
      expectedCommission: lead.expectedCommission,
      nextFollowUpDate: lead.nextFollowUpDate,
      notes: lead.notes,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
    });
    setIsFormOpen(true);
  }

  function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedLead = {
      ...form,
      clientName: form.clientName.trim(),
      niche: form.niche.trim(),
      notes: form.notes.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dealValue: Number(form.dealValue) || 0,
      expectedCommission: Number(form.expectedCommission) || 0,
    };

    if (editingLead) {
      updateLead({ ...editingLead, ...normalizedLead });
    } else {
      addLead(normalizedLead);
    }

    setEditingLead(null);
    setForm(emptyLeadForm);
    setIsFormOpen(false);
  }

  function removeLead(leadId: string) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    setLeadToDelete(lead);
  }

  function confirmLeadDeletion() {
    if (!leadToDelete) return;
    deleteLead(leadToDelete.id);
    setLeadToDelete(null);
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold text-white">Leads</h1>
            <p className="text-sm text-slate-400">
              Manage and track all your business opportunities
            </p>
          </div>
          <button
            type="button"
            onClick={openNewLeadForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Add new lead
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={saveLead}
            className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {editingLead ? "Edit lead" : "Add new lead"}
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
                Client name
                <input
                  required
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Niche
                <input
                  required
                  value={form.niche}
                  onChange={(event) => setForm({ ...form, niche: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Agency
                <select
                  value={form.sourceAgency}
                  onChange={(event) => {
                    const newAgency = event.target.value as Agency;
                    const auto = calculateCommission(newAgency, form.dealValue, rules);
                    setForm({
                      ...form,
                      sourceAgency: newAgency,
                      ...(auto !== null ? { expectedCommission: auto } : {}),
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  {agencies.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as LeadStatus })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Deal value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.dealValue}
                  onChange={(event) => {
                    const newValue = Number(event.target.value);
                    const auto = calculateCommission(form.sourceAgency, newValue, rules);
                    setForm({
                      ...form,
                      dealValue: newValue,
                      ...(auto !== null ? { expectedCommission: auto } : {}),
                    });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Expected commission
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.expectedCommission}
                  onChange={(event) =>
                    setForm({ ...form, expectedCommission: Number(event.target.value) })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Follow-up date
                <input
                  type="date"
                  required
                  value={form.nextFollowUpDate}
                  onChange={(event) =>
                    setForm({ ...form, nextFollowUpDate: event.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">
                Notes
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
                Save lead
              </button>
            </div>
          </form>
        )}

        <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedStatus === null
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                {statuses.map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedStatus === status
                        ? getStatusColor(status)
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                Agency
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgency(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedAgency === null
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                {leadAgencies.map((agency) => (
                  <button
                    type="button"
                    key={agency}
                    onClick={() => setSelectedAgency(agency)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedAgency === agency
                        ? getAgencyColor(agency)
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {agency}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">
              All Leads <span className="font-normal text-slate-400">({filteredLeads.length})</span>
            </h2>
            <div className="flex overflow-hidden rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => switchView("table")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => switchView("kanban")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === "kanban"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Kanban
              </button>
            </div>
          </div>
          {view === "kanban" ? (
            <KanbanView
              leads={filteredLeads}
              onEdit={openEditLeadForm}
              onMove={moveLead}
              onSuggest={setSuggestingLead}
            />
          ) : (
            <LeadsTable
              leads={filteredLeads}
              onEdit={openEditLeadForm}
              onDelete={removeLead}
              onSuggest={setSuggestingLead}
            />
          )}
        </div>

        {view === "table" && filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-white">
                      {lead.clientName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{lead.niche}</p>
                  </div>
                  <span className={`shrink-0 ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="mb-4 space-y-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-slate-400">Agency:</span>
                    <span className={getAgencyColor(lead.sourceAgency)}>
                      {lead.sourceAgency}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-slate-400">Deal Value:</span>
                    <span className="break-words text-right text-sm font-semibold text-white">
                      {formatCurrency(lead.dealValue)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-slate-400">Expected Commission:</span>
                    <span className="break-words text-right text-sm font-semibold text-emerald-400">
                      {formatCurrency(lead.expectedCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-xs text-slate-400">Next Follow-up:</span>
                    <span className="text-sm font-semibold text-white">
                      {new Date(lead.nextFollowUpDate + "T00:00:00").toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {lead.notes && (
                  <div className="border-t border-slate-700/50 pt-4">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Notes: </span>
                      {lead.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-800"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuggestingLead(lead)}
                    className="rounded-md bg-violet-900 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-800"
                  >
                    Suggest message
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditLeadForm(lead)}
                    className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLead(lead.id)}
                    className="rounded-md bg-rose-950 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : view === "table" ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-12 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-400">No leads found matching your filters.</p>
          </div>
        ) : null}
      </div>
      <ConfirmDeleteModal
        isOpen={Boolean(leadToDelete)}
        message={
          leadToDelete
            ? `Are you sure you want to delete ${leadToDelete.clientName}?`
            : ""
        }
        onCancel={() => setLeadToDelete(null)}
        onConfirm={confirmLeadDeletion}
      />
      {suggestingLead && (
        <SuggestMessageModal
          lead={suggestingLead}
          onClose={() => setSuggestingLead(null)}
        />
      )}
    </main>
  );
}
