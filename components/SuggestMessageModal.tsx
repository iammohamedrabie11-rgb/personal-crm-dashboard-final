"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/lib/types";
import { formatCurrency, getDaysUntil } from "@/lib/utils";

interface Props {
  lead: Lead;
  onClose: () => void;
}

export function SuggestMessageModal({ lead, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchSuggestion() {
    setLoading(true);
    setError("");
    setMessage("");
    setCopied(false);

    const daysSinceFollowUp = Math.abs(getDaysUntil(lead.nextFollowUpDate));

    try {
      const res = await fetch("/api/suggest-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead: {
            name: lead.clientName,
            niche: lead.niche,
            agency: lead.sourceAgency,
            status: lead.status,
            dealValue: formatCurrency(lead.dealValue),
            daysSinceFollowUp,
            notes: lead.notes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text manually
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-700/50 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Suggested follow-up message</h2>
            <p className="mt-0.5 text-xs text-slate-400">{lead.clientName} · {lead.niche}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-6">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Generating message in Arabic…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-700/50 bg-rose-900/20 px-4 py-4">
            <p className="mb-3 text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={fetchSuggestion}
              className="rounded-md bg-rose-800 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {message && (
          <>
            <div
              dir="rtl"
              className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-4 py-4 text-sm leading-relaxed text-white"
            >
              {message}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={copyMessage}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                {copied ? "Copied!" : "Copy message"}
              </button>
              <button
                type="button"
                onClick={fetchSuggestion}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
