"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultThemeId, getTheme, THEME_STORAGE_KEY, ThemeId, themes } from "@/lib/themes";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(themeId: ThemeId) {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.colorScheme;

  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultThemeId);

  useEffect(() => {
    const storedTheme = getTheme(window.localStorage.getItem(THEME_STORAGE_KEY)).id;
    applyTheme(storedTheme);
    const timer = window.setTimeout(() => setThemeIdState(storedTheme), 0);

    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: (nextThemeId: ThemeId) => {
        const nextTheme = getTheme(nextThemeId).id;
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        setThemeIdState(nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [themeId]
  );

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  const selectedTheme = getTheme(context.themeId);
  return {
    ...context,
    selectedTheme,
    themes,
  };
}
