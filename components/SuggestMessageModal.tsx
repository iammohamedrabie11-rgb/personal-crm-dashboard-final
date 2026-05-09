"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/lib/types";
import { formatCurrency, getDaysUntil } from "@/lib/utils";

interface Props {
  lead: Lead;
  onClose: () => void;
}

function getFollowUpTiming(lead: Lead) {
  const daysUntil = getDaysUntil(lead.nextFollowUpDate);

  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return "Due today";
  return `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
}

export function SuggestMessageModal({ lead, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadSuggestion() {
      try {
        const res = await fetch("/api/suggest-message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            lead: {
              name: lead.clientName,
              niche: lead.niche,
              agency: lead.sourceAgency,
              status: lead.status,
              dealValue: formatCurrency(lead.dealValue),
              followUpTiming: getFollowUpTiming(lead),
              notes: lead.notes,
            },
          }),
        });

        const data = (await res.json()) as { message?: string; error?: string };
        if (!isActive) return;

        if (!res.ok || data.error) {
          setError(data.error ?? "Something went wrong. Please try again.");
        } else {
          setMessage(data.message ?? "");
        }
      } catch (caughtError) {
        if (!isActive || controller.signal.aborted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Network error. Please check your connection."
        );
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadSuggestion();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [lead, requestVersion]);

  function requestSuggestion() {
    setLoading(true);
    setError("");
    setMessage("");
    setCopied(false);
    setRequestVersion((current) => current + 1);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy automatically. Select the text and copy it manually.");
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
            <h2 className="text-base font-semibold text-white">
              Suggested follow-up message
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {lead.clientName} - {lead.niche}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-6">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Generating message in Arabic...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-700/50 bg-rose-900/20 px-4 py-4">
            <p className="mb-3 text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={requestSuggestion}
              className="rounded-md bg-rose-800 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {message && !loading && (
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
                onClick={requestSuggestion}
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
