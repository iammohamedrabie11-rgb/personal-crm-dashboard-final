"use client";

import { useTheme } from "@/components/ThemeProvider";
import { ThemeId } from "@/lib/themes";

export default function SettingsPage() {
  const { themeId, setThemeId, selectedTheme, themes } = useTheme();

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
                  <p className="mt-2 break-words text-2xl font-bold text-white">
                    EGP 2,500.50
                  </p>
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

          <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">App preferences</h2>
            <p className="mt-2 text-sm text-slate-400">
              More workspace preferences will live here later.
            </p>
            <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-700/20 p-4">
              <p className="text-sm font-medium text-white">Coming soon</p>
              <p className="mt-1 text-sm text-slate-400">
                Defaults, reminders, display density, and export settings can be added without
                changing the theme system.
              </p>
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}
