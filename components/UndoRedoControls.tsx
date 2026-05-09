"use client";

import { useEffect, useState } from "react";
import {
  getHistoryAvailability,
  redoHistory,
  subscribeHistory,
  undoHistory,
} from "@/lib/appHistory";

export function UndoRedoControls() {
  const [availability, setAvailability] = useState(() => getHistoryAvailability());

  useEffect(() => {
    return subscribeHistory(() => setAvailability(getHistoryAvailability()));
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6">
      <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1.5 shadow-lg shadow-black/10 backdrop-blur-sm">
        <HistoryButton
          label="Undo"
          disabled={!availability.canUndo}
          onClick={undoHistory}
        />
        <HistoryButton
          label="Redo"
          disabled={!availability.canRedo}
          onClick={redoHistory}
        />
      </div>
    </div>
  );
}

function HistoryButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent sm:text-sm"
    >
      {label}
    </button>
  );
}
