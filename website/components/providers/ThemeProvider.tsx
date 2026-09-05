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
const BASE_CSS_VAR_MAP: Record<string, string> = {
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

// Button variant keys map to CSS variable names WITHOUT prefix
// applyOverrides() will add the --light-- or --dark-- prefix based on active mode
const BUTTON_VARIANT_KEYS: Record<string, string> = {};
const variants = ["error", "success", "warning", "info"];
const types = ["solid", "outline"];
const props = ["color", "bg", "border"];
const states = ["", "Hover", "Active"];

variants.forEach((variant) => {
  types.forEach((type) => {
    props.forEach((prop) => {
      states.forEach((state) => {
        const key = `${variant}${type.charAt(0).toUpperCase() + type.slice(1)}Button${prop.charAt(0).toUpperCase() + prop.slice(1)}${state}`;
        const cssVar = `--app-${variant}-${type}-button-${prop}${state ? "-" + state.toLowerCase() : ""}`;
        BUTTON_VARIANT_KEYS[key] = cssVar;
      });
    });
  });
});

const CSS_VAR_MAP: Record<string, string> = {
  ...BASE_CSS_VAR_MAP,
  ...BUTTON_VARIANT_KEYS,
};

/**
 * Apply theme variables for the active mode only.
 * Admin sets one mode (dark or light) — users can't toggle.
 * Button variants get prefixed with the active mode only.
 */
function applyOverrides(vars: Record<string, string>, activeMode: "light" | "dark") {
  const root = document.documentElement;
  const prefix = `--${activeMode}--`;
  Object.entries(vars).forEach(([key, value]) => {
    const cssVar = CSS_VAR_MAP[key];
    if (cssVar && value) {
      if (key.includes("Button")) {
        // Button variants: set only for the active mode
        root.style.setProperty(cssVar.replace("--app-", prefix + "app-"), value);
      } else {
        // Base variables: set directly (same for both modes)
        root.style.setProperty(cssVar, value);
      }
    }
  });
}

/** Inject or update the admin custom CSS <style> tag as last child of <body> */
function injectCustomCss(css: string) {
  if (typeof document === "undefined") return;
  const id = "gofetch-admin-custom-css";
  let styleEl = document.getElementById(id) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.type = "text/css";
    document.body.appendChild(styleEl);
  } else if (styleEl.nextSibling !== null) {
    // Move to end of <body> if it's not already the last child
    document.body.appendChild(styleEl);
  }
  styleEl.textContent = css;
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
        const activeMode = document.documentElement.classList.contains("dark") ? "dark" : "light";
        if (activeMode === "dark" && data.dark) applyOverrides(data.dark, "dark");
        else if (activeMode === "light" && data.light) applyOverrides(data.light, "light");
        // Inject custom CSS if present
        if (data.customCss) injectCustomCss(data.customCss);
      })
      .catch(() => {});

    // Re-inject after 3s to re-position after Connect button flow
    const timer = setTimeout(() => {
      fetch("/api/admin/theme")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.customCss) injectCustomCss(data.customCss);
        })
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
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
        const activeMode = document.documentElement.classList.contains("dark") ? "dark" : "light";
        if (activeMode === "dark" && data.dark) applyOverrides(data.dark, "dark");
        else if (activeMode === "light" && data.light) applyOverrides(data.light, "light");
        // Re-inject custom CSS
        if (data.customCss) injectCustomCss(data.customCss);
      })
      .catch(() => {});
  }, []);

  const applyOverridesCallback = useCallback((light: Record<string, string>, dark: Record<string, string>) => {
    const activeMode = document.documentElement.classList.contains("dark") ? "dark" : "light";
    if (activeMode === "dark") applyOverrides(dark, "dark");
    else applyOverrides(light, "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, applyOverrides: applyOverridesCallback }}>
      {children}
    </ThemeContext.Provider>
  );
}
