"use client";

import { useTheme } from "@/components/ThemeProvider";
import {
  useCommissionRules,
  type CommissionRules,
} from "@/lib/commissionRules";
import { useGoalSettings } from "@/lib/goalSettings";
import { ThemeId } from "@/lib/themes";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const { themeId, setThemeId, selectedTheme, themes } = useTheme();
  const { rules, setRules } = useCommissionRules();
  const { goal, setGoal } = useGoalSettings();

  function updateDomya(next: Partial<CommissionRules["domya"]>) {
    setRules({
      ...rules,
      domya: {
        ...rules.domya,
        ...next,
      },
    });
  }

  function updateKrijo(next: Partial<CommissionRules["krijo"]>) {
    setRules({
      ...rules,
      krijo: {
        ...rules.krijo,
        ...next,
      },
    });
  }

  function toggleKrijoMode() {
    const next: CommissionRules = {
      ...rules,
      krijo: {
        ...rules.krijo,
        mode: rules.krijo.mode === "flat" ? "percentage" : "flat",
      },
    };
    setRules(next);
  }

  const domyaPreview =
    rules.domya.baseAmount > 0 || rules.domya.percentage > 0
      ? `${formatCurrency(rules.domya.baseAmount)} + ${rules.domya.percentage}% of deal`
      : "No rule set";

  const krijoPreview =
    rules.krijo.mode === "flat"
      ? rules.krijo.flatAmount > 0
        ? `Flat ${formatCurrency(rules.krijo.flatAmount)}`
        : "No rule set"
      : rules.krijo.percentage > 0
        ? `${rules.krijo.percentage}% of deal`
        : "No rule set";

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400">
            Control app-wide preferences for your CRM workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Appearance ── */}
          <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <p className="mt-2 text-sm text-slate-400">
                Choose how your CRM looks across all pages.
              </p>
            </div>

            <label className="block max-w-md text-xs font-semibold uppercase tracking-wide text-slate-300">
              Theme
              <select
                value={themeId}
                onChange={(event) => setThemeId(event.target.value as ThemeId)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-700/20 p-5">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedTheme.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{selectedTheme.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {selectedTheme.effect}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedTheme.previewColors.map((color) => (
                    <span
                      key={color}
                      className="h-8 w-8 rounded-full border border-slate-700/50"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sample card
                  </p>
                  <p className="mt-2 break-words text-2xl font-bold text-white">EGP 2,500.50</p>
                  <p className="mt-1 text-sm text-slate-400">Previewing themed data surfaces.</p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    Sample button
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-6">
            {/* Monthly Income Goal */}
            <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white">Monthly Income Goal</h2>
              <p className="mt-2 text-sm text-slate-400">
                Set a target to track progress on the dashboard.
              </p>
              <div className="mt-5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Goal amount (EGP)
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={goal.monthlyIncomeGoal || ""}
                    onChange={(e) =>
                      setGoal({ monthlyIncomeGoal: Number(e.target.value) || 0 })
                    }
                    placeholder="e.g. 50000"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
                {goal.monthlyIncomeGoal > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Current goal: {formatCurrency(goal.monthlyIncomeGoal)}
                  </p>
                )}
              </div>
            </section>

            {/* App preferences placeholder */}
            <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white">App preferences</h2>
              <p className="mt-2 text-sm text-slate-400">
                More workspace preferences will live here later.
              </p>
              <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-700/20 p-4">
                <p className="text-sm font-medium text-white">Coming soon</p>
                <p className="mt-1 text-sm text-slate-400">
                  Defaults, reminders, display density, and export settings.
                </p>
              </div>
            </section>
          </div>

          {/* ── Commission Rules (full width) ── */}
          <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Commission Rules</h2>
              <p className="mt-2 text-sm text-slate-400">
                Configure automatic commission calculation per agency. When a rule is set, editing
                a lead&apos;s deal value auto-fills the expected commission. Freelance and Personal
                leads are always manual.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Domya */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-700/20 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Domya</h3>
                  <span className="rounded-full bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                    Base + %
                  </span>
                </div>
                <p className="mb-4 text-xs text-slate-500">
                  Commission = base amount + percentage of deal value
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Base (EGP)
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={rules.domya.baseAmount || ""}
                      onChange={(e) =>
                        updateDomya({ baseAmount: Number(e.target.value) || 0 })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Percentage (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={rules.domya.percentage || ""}
                      onChange={(e) =>
                        updateDomya({ percentage: Number(e.target.value) || 0 })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs text-slate-500">Preview: {domyaPreview}</p>
              </div>

              {/* Krijo */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-700/20 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Krijo</h3>
                  <button
                    type="button"
                    onClick={toggleKrijoMode}
                    className="rounded-full border border-slate-600 bg-slate-800 px-3 py-0.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    Mode: {rules.krijo.mode === "flat" ? "Flat amount" : "Percentage"}
                  </button>
                </div>
                <p className="mb-4 text-xs text-slate-500">
                  {rules.krijo.mode === "flat"
                    ? "Commission = fixed flat amount regardless of deal value"
                    : "Commission = percentage of deal value"}
                </p>
                {rules.krijo.mode === "flat" ? (
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Flat amount (EGP)
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={rules.krijo.flatAmount || ""}
                      onChange={(e) =>
                        updateKrijo({ flatAmount: Number(e.target.value) || 0 })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                ) : (
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Percentage (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={rules.krijo.percentage || ""}
                      onChange={(e) =>
                        updateKrijo({ percentage: Number(e.target.value) || 0 })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                )}
                <p className="mt-3 text-xs text-slate-500">Preview: {krijoPreview}</p>
              </div>

              {/* Freelance */}
              <div className="rounded-xl border border-slate-700/30 bg-slate-700/10 p-5 opacity-60">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Freelance</h3>
                  <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                    Manual only
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  No automatic rule — enter commission manually on each lead.
                </p>
              </div>

              {/* Personal */}
              <div className="rounded-xl border border-slate-700/30 bg-slate-700/10 p-5 opacity-60">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Personal</h3>
                  <span className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                    Manual only
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  No automatic rule — enter commission manually on each lead.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
