"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useCrmData } from "@/lib/crmStorage";
import { Lead } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getAgencyColor,
  getDaysUntil,
  getStatusColor,
  makeWhatsAppUrl,
} from "@/lib/utils";

export default function FollowUpsPage() {
  const { leads, updateLead } = useCrmData();
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});

  const followUpLeads = leads
    .filter((lead) => lead.status === "Follow-up" || lead.status === "Proposal Sent")
    .sort((a, b) => getDaysUntil(a.nextFollowUpDate) - getDaysUntil(b.nextFollowUpDate));

  const overdue = followUpLeads.filter((lead) => getDaysUntil(lead.nextFollowUpDate) < 0);
  const urgent = followUpLeads.filter(
    (lead) => getDaysUntil(lead.nextFollowUpDate) >= 0 && getDaysUntil(lead.nextFollowUpDate) <= 2
  );
  const upcoming = followUpLeads.filter((lead) => getDaysUntil(lead.nextFollowUpDate) > 2);

  function saveFollowUpDate(lead: Lead) {
    const nextFollowUpDate = dateDrafts[lead.id] || lead.nextFollowUpDate;
    updateLead({ ...lead, nextFollowUpDate });
  }

  const FollowUpCard = ({ lead }: { lead: Lead }) => {
    const daysUntil = getDaysUntil(lead.nextFollowUpDate);
    const isOverdue = daysUntil < 0;
    const whatsappUrl = makeWhatsAppUrl(lead.phone);

    let urgencyColor = "";
    let urgencyLabel = "";

    if (isOverdue) {
      urgencyColor = "border-rose-700/50 bg-rose-900/20";
      urgencyLabel = `${Math.abs(daysUntil)} days overdue`;
    } else if (daysUntil === 0) {
      urgencyColor = "border-amber-700/50 bg-amber-900/20";
      urgencyLabel = "Today";
    } else if (daysUntil <= 2) {
      urgencyColor = "border-amber-700/50 bg-amber-900/20";
      urgencyLabel = `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    } else {
      urgencyColor = "border-emerald-700/50 bg-emerald-900/20";
      urgencyLabel = `In ${daysUntil} days`;
    }

    return (
      <div className={`rounded-xl border p-5 ${urgencyColor}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold text-white">{lead.clientName}</h3>
            <p className="mt-1 text-xs text-slate-400">{lead.niche}</p>
          </div>
          <span className={`shrink-0 ${getStatusColor(lead.status)}`}>
            {lead.status}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Agency</p>
            <span className={`mt-1.5 ${getAgencyColor(lead.sourceAgency)}`}>
              {lead.sourceAgency}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Deal Value</p>
            <p className="mt-1.5 break-words text-sm font-bold text-white">
              {formatCurrency(lead.dealValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Commission</p>
            <p className="mt-1.5 break-words text-sm font-bold text-emerald-400">
              {formatCurrency(lead.expectedCommission)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Follow-up Date</p>
            <p className="mt-1.5 text-sm font-bold text-white">
              {formatDate(lead.nextFollowUpDate)}
            </p>
          </div>
        </div>

        <div
          className={`mt-4 w-full ${
            isOverdue
              ? "crm-badge crm-finance-status-missed"
              : daysUntil <= 2
                ? "crm-badge crm-finance-status-upcoming"
                : "crm-badge crm-finance-status-paid"
          }`}
        >
          {urgencyLabel}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-700/30 pt-4 sm:flex-row">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-900 px-4 py-2 text-center text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-800"
            >
              WhatsApp
            </a>
          )}
          <input
            type="date"
            value={dateDrafts[lead.id] ?? lead.nextFollowUpDate}
            onChange={(event) =>
              setDateDrafts((current) => ({ ...current, [lead.id]: event.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => saveFollowUpDate(lead)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Save date
          </button>
        </div>

        {lead.notes && (
          <div className="mt-4 border-t border-slate-700/30 pt-4">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Notes: </span>
              {lead.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-semibold text-white">Follow-ups</h1>
          <p className="text-sm text-slate-400">Stay on top of your pending opportunities</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Total Follow-ups" value={followUpLeads.length} />
          <SummaryCard label="Overdue" value={overdue.length} tone="rose" />
          <SummaryCard label="Urgent" value={urgent.length} tone="amber" />
          <SummaryCard label="Upcoming" value={upcoming.length} tone="emerald" />
        </div>

        {overdue.length > 0 && (
          <FollowUpSection title="Overdue Follow-ups" color="text-rose-400">
            {overdue.map((lead) => (
              <FollowUpCard key={lead.id} lead={lead} />
            ))}
          </FollowUpSection>
        )}

        {urgent.length > 0 && (
          <FollowUpSection title="Urgent (Next 2 Days)" color="text-amber-400">
            {urgent.map((lead) => (
              <FollowUpCard key={lead.id} lead={lead} />
            ))}
          </FollowUpSection>
        )}

        {upcoming.length > 0 && (
          <FollowUpSection title="Upcoming Follow-ups" color="text-emerald-400">
            {upcoming.map((lead) => (
              <FollowUpCard key={lead.id} lead={lead} />
            ))}
          </FollowUpSection>
        )}

        {followUpLeads.length === 0 && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-12 text-center backdrop-blur-sm">
            <p className="text-sm text-slate-400">All caught up. No pending follow-ups.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function FollowUpSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className={`mb-4 text-base font-semibold ${color}`}>{title}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "rose" | "amber" | "emerald";
}) {
  const classes = {
    white: "border-slate-700/50 bg-slate-800/40 text-white",
    rose: "border-rose-700/50 bg-rose-900/20 text-rose-400",
    amber: "border-amber-700/50 bg-amber-900/20 text-amber-400",
    emerald: "border-emerald-700/50 bg-emerald-900/20 text-emerald-400",
  }[tone];

  return (
    <div className={`rounded-xl border p-5 ${classes}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold leading-tight">{value}</p>
    </div>
  );
}
