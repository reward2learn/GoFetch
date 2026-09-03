"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  applyOverrides: (light: Record<string, string>, dark: Record<string, string>) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "dark",
  setMode: () => {},
  applyOverrides: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemPreference() : mode;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  return resolved;
}

// Map theme keys to CSS variable names
const CSS_VAR_MAP: Record<string, string> = {
  primary: "--app-primary",
  primaryHover: "--app-primary-hover",
  primaryActive: "--app-primary-active",
  secondary: "--app-secondary",
  secondaryHover: "--app-secondary-hover",
  bg: "--app-bg",
  surface0: "--app-surface-0",
  surface1: "--app-surface-1",
  surface2: "--app-surface-2",
  surface3: "--app-surface-3",
  text: "--app-text",
  textSecondary: "--app-text-secondary",
  textMuted: "--app-text-muted",
  textDisabled: "--app-text-disabled",
  border: "--app-border",
  borderStrong: "--app-border-strong",
  successBg: "--app-success-bg",
  successText: "--app-success-text",
  successBorder: "--app-success-border",
  errorBg: "--app-error-bg",
  errorText: "--app-error-text",
  errorBorder: "--app-error-border",
  warningBg: "--app-warning-bg",
  warningText: "--app-warning-text",
  warningBorder: "--app-warning-border",
  infoBg: "--app-info-bg",
  infoText: "--app-info-text",
  infoBorder: "--app-info-border",
};

function applyOverrides(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    const cssVar = CSS_VAR_MAP[key];
    if (cssVar && value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  // Load saved preference + admin theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as ThemeMode | null;
    const initialMode = saved && ["light", "dark", "system"].includes(saved) ? saved : "system";
    setModeState(initialMode);
    setResolved(applyTheme(initialMode));

    // Fetch admin theme overrides
    fetch("/api/admin/theme")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        const isDark = document.documentElement.classList.contains("dark");
        if (isDark && data.dark) applyOverrides(data.dark);
        else if (!isDark && data.light) applyOverrides(data.light);
      })
      .catch(() => {});
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") {
        setResolved(applyTheme("system"));
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("app-theme", newMode);
    const resolvedMode = applyTheme(newMode);
    setResolved(resolvedMode);
    // Re-fetch and apply admin theme overrides for the new mode
    fetch("/api/admin/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const isDark = document.documentElement.classList.contains("dark");
        if (isDark && data.dark) applyOverrides(data.dark);
        else if (!isDark && data.light) applyOverrides(data.light);
      })
      .catch(() => {});
  }, []);

  const applyOverridesCallback = useCallback((light: Record<string, string>, dark: Record<string, string>) => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) applyOverrides(dark);
    else applyOverrides(light);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, applyOverrides: applyOverridesCallback }}>
      {children}
    </ThemeContext.Provider>
  );
}
