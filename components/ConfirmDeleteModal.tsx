"use client";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  message,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-700/70 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="mb-5">
          <p
            id="confirm-delete-title"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Confirm deletion
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition-colors hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
