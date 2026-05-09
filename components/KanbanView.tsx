"use client";

import { useState } from "react";
import { Lead, LeadStatus } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getAgencyColor,
  makeWhatsAppUrl,
} from "@/lib/utils";

const ORDERED_STATUSES: LeadStatus[] = [
  "New Lead",
  "Contacted",
  "Meeting",
  "Proposal Sent",
  "Follow-up",
  "Closed",
  "Lost",
];

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  "New Lead": "Contacted",
  "Contacted": "Meeting",
  "Meeting": "Proposal Sent",
  "Proposal Sent": "Follow-up",
  "Follow-up": "Closed",
  "Closed": "Lost",
};

const COLUMN_COLORS: Record<LeadStatus, string> = {
  "New Lead": "border-slate-600/50 bg-slate-800/30",
  "Contacted": "border-blue-700/40 bg-blue-900/10",
  "Meeting": "border-violet-700/40 bg-violet-900/10",
  "Proposal Sent": "border-amber-700/40 bg-amber-900/10",
  "Follow-up": "border-orange-700/40 bg-orange-900/10",
  "Closed": "border-emerald-700/40 bg-emerald-900/10",
  "Lost": "border-rose-700/40 bg-rose-900/10",
};

const HEADER_COLORS: Record<LeadStatus, string> = {
  "New Lead": "text-slate-300",
  "Contacted": "text-blue-300",
  "Meeting": "text-violet-300",
  "Proposal Sent": "text-amber-300",
  "Follow-up": "text-orange-300",
  "Closed": "text-emerald-300",
  "Lost": "text-rose-300",
};

interface KanbanViewProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead, newStatus: LeadStatus) => void;
}

export function KanbanView({ leads, onEdit, onMove }: KanbanViewProps) {
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const byStatus = Object.fromEntries(
    ORDERED_STATUSES.map((status) => [
      status,
      leads.filter((lead) => lead.status === status),
    ])
  ) as Record<LeadStatus, Lead[]>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ORDERED_STATUSES.map((status) => {
        const columnLeads = byStatus[status];
        const isDragTarget = dragOverStatus === status;

        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={(event) => {
              const nextTarget = event.relatedTarget;
              if (
                nextTarget instanceof Node &&
                event.currentTarget.contains(nextTarget)
              ) {
                return;
              }
              setDragOverStatus(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const leadId = event.dataTransfer.getData("text/plain");
              const lead = leads.find((item) => item.id === leadId);
              setDragOverStatus(null);

              if (lead && lead.status !== status) {
                onMove(lead, status);
              }
            }}
            className={`flex w-64 shrink-0 flex-col rounded-xl border ${COLUMN_COLORS[status]} p-3 transition-colors ${
              isDragTarget ? "ring-2 ring-blue-400/60" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className={`text-xs font-semibold uppercase tracking-wide ${HEADER_COLORS[status]}`}>
                {status}
              </h3>
              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-300">
                {columnLeads.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {columnLeads.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDragStart={() => setDragOverStatus(null)}
                />
              ))}
              {columnLeads.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-600">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onMove: (lead: Lead, newStatus: LeadStatus) => void;
  onDragStart: () => void;
}

function KanbanCard({
  lead,
  onEdit,
  onMove,
  onDragStart,
}: KanbanCardProps) {
  const nextStatus = NEXT_STATUS[lead.status];
  const whatsappUrl = makeWhatsAppUrl(lead.phone);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", lead.id);
        onDragStart();
      }}
      className="cursor-grab rounded-lg border border-slate-700/50 bg-slate-800/60 p-3 backdrop-blur-sm active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={() => onEdit(lead)}
        className="mb-2 w-full text-left"
      >
        <p className="break-words text-sm font-semibold text-white leading-snug">
          {lead.clientName}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 truncate">{lead.niche}</p>
      </button>

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`text-xs ${getAgencyColor(lead.sourceAgency)}`}>
          {lead.sourceAgency}
        </span>
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Deal</span>
          <span className="text-xs font-semibold text-white">{formatCurrency(lead.dealValue)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Commission</span>
          <span className="text-xs font-semibold text-emerald-400">
            {formatCurrency(lead.expectedCommission)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Follow-up</span>
          <span className="text-xs text-slate-300">{formatDate(lead.nextFollowUpDate)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-emerald-900/60 px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-800/60"
          >
            WA
          </a>
        )}
        {nextStatus && (
          <button
            type="button"
            onClick={() => onMove(lead, nextStatus)}
            className="rounded bg-slate-700/60 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600/60"
          >
            Next: {nextStatus}
          </button>
        )}
      </div>
    </div>
  );
}
