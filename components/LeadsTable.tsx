"use client";

import { Lead } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor, getAgencyColor } from "@/lib/utils";

interface LeadsTableProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onSuggest?: (lead: Lead) => void;
}

export function LeadsTable({ leads, onEdit, onDelete, onSuggest }: LeadsTableProps) {
  const hasActions = Boolean(onEdit || onDelete || onSuggest);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="px-3 py-2 text-left font-semibold text-slate-300">Client Name</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-300">Niche</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-300">Agency</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-300">Status</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-300">Deal Value</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-300">Commission</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-300">Follow-up</th>
            {hasActions && (
              <th className="px-3 py-2 text-right font-semibold text-slate-300">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
              <td className="px-3 py-2.5 font-medium text-white">{lead.clientName}</td>
              <td className="px-3 py-2.5 text-slate-400">{lead.niche}</td>
              <td className="px-3 py-2.5">
                <span className={getAgencyColor(lead.sourceAgency)}>
                  {lead.sourceAgency}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className={getStatusColor(lead.status)}>
                  {lead.status}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right text-white">{formatCurrency(lead.dealValue)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-400 font-semibold">{formatCurrency(lead.expectedCommission)}</td>
              <td className="px-3 py-2.5 text-slate-400">{formatDate(lead.nextFollowUpDate)}</td>
              {hasActions && (
                <td className="px-3 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-emerald-900 px-2 py-1 font-medium text-emerald-200 transition-colors hover:bg-emerald-800"
                      >
                        WA
                      </a>
                    )}
                    {onSuggest && (
                      <button
                        type="button"
                        onClick={() => onSuggest(lead)}
                        className="rounded-md bg-violet-900 px-2 py-1 font-medium text-violet-200 transition-colors hover:bg-violet-800"
                      >
                        Suggest
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(lead)}
                        className="rounded-md bg-slate-700 px-2 py-1 font-medium text-slate-100 transition-colors hover:bg-slate-600"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(lead.id)}
                        className="rounded-md bg-rose-950 px-2 py-1 font-medium text-rose-200 transition-colors hover:bg-rose-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
