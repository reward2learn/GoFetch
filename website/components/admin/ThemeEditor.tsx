"use client";

import { useState, useEffect, useCallback } from "react";

interface ThemeValues {
  [key: string]: string;
}

interface ThemeData {
  light: ThemeValues;
  dark: ThemeValues;
}

const DEFAULT_THEME: ThemeData = {
  light: {
    primary: "#2A5A4A",
    primaryHover: "#234d3f",
    primaryActive: "#1c4034",
    secondary: "#C97A5E",
    secondaryHover: "#b56a4e",
    bg: "#FCFBFA",
    surface0: "#FCFBFA",
    surface1: "#FFFFFF",
    surface2: "#F8F7F5",
    surface3: "#F2F0ED",
    text: "#1a1a1a",
    textSecondary: "#4B5563",
    textMuted: "#6B7280",
    textDisabled: "#9CA3AF",
    border: "#E5E3DF",
    borderStrong: "#D1D5DB",
    successBg: "#DCFCE7",
    successText: "#16A34A",
    successBorder: "#BBF7D0",
    errorBg: "#FEE2E2",
    errorText: "#DC2626",
    errorBorder: "#FECACA",
    warningBg: "#FEF9C3",
    warningText: "#CA8A04",
    warningBorder: "#FEF08A",
    infoBg: "#DBEAFE",
    infoText: "#2563EB",
    infoBorder: "#BFDBFE",
  },
  dark: {
    primary: "#3d8b6e",
    primaryHover: "#2A5A4A",
    primaryActive: "#234d3f",
    secondary: "#d4896a",
    secondaryHover: "#C97A5E",
    bg: "#0f1114",
    surface0: "#0f1114",
    surface1: "#181b20",
    surface2: "#1e2127",
    surface3: "#252830",
    text: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    textDisabled: "#52525b",
    border: "#2e3138",
    borderStrong: "#383b42",
    successBg: "rgba(34,197,94,0.12)",
    successText: "#4ade80",
    successBorder: "rgba(34,197,94,0.25)",
    errorBg: "rgba(239,68,68,0.12)",
    errorText: "#f87171",
    errorBorder: "rgba(239,68,68,0.25)",
    warningBg: "rgba(234,179,8,0.12)",
    warningText: "#facc15",
    warningBorder: "rgba(234,179,8,0.25)",
    infoBg: "rgba(59,130,246,0.12)",
    infoText: "#60a5fa",
    infoBorder: "rgba(59,130,246,0.25)",
  },
};

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

// Human-readable labels
const LABELS: Record<string, string> = {
  primary: "Primary",
  primaryHover: "Primary Hover",
  primaryActive: "Primary Active",
  secondary: "Secondary",
  secondaryHover: "Secondary Hover",
  bg: "Background",
  surface0: "Surface 0",
  surface1: "Surface 1",
  surface2: "Surface 2",
  surface3: "Surface 3",
  text: "Text Primary",
  textSecondary: "Text Secondary",
  textMuted: "Text Muted",
  textDisabled: "Text Disabled",
  border: "Border",
  borderStrong: "Border Strong",
  successBg: "Success BG",
  successText: "Success Text",
  successBorder: "Success Border",
  errorBg: "Error BG",
  errorText: "Error Text",
  errorBorder: "Error Border",
  warningBg: "Warning BG",
  warningText: "Warning Text",
  warningBorder: "Warning Border",
  infoBg: "Info BG",
  infoText: "Info Text",
  infoBorder: "Info Border",
};

// Groups for organized display
const GROUPS = [
  { label: "Brand", keys: ["primary", "primaryHover", "primaryActive", "secondary", "secondaryHover"] },
  { label: "Surfaces", keys: ["bg", "surface0", "surface1", "surface2", "surface3"] },
  { label: "Text", keys: ["text", "textSecondary", "textMuted", "textDisabled"] },
  { label: "Borders", keys: ["border", "borderStrong"] },
  { label: "Success", keys: ["successBg", "successText", "successBorder"] },
  { label: "Error", keys: ["errorBg", "errorText", "errorBorder"] },
  { label: "Warning", keys: ["warningBg", "warningText", "warningBorder"] },
  { label: "Info", keys: ["infoBg", "infoText", "infoBorder"] },
];

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  // For hex colors, use native color picker
  const isHex = value.startsWith("#") && (value.length === 7 || value.length === 4);
  // For rgba colors, show text input
  const isRgba = value.startsWith("rgba");

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted w-32 shrink-0" style={{  minWidth: "16rem"}}>{label}</label>
      <div className="flex items-center gap-2 flex-1">
        {isHex ? (
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0"
          />
        ) : null}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

export default function ThemeEditor() {
  const [theme, setTheme] = useState<ThemeData>(DEFAULT_THEME);
  const [tab, setTab] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load theme on mount
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadTheme = async () => {
      try {
        const res = await fetch("/api/admin/theme", { signal: controller.signal });
        if (!ignore && res.ok) {
          const data = await res.json();
          if (data.light || data.dark) {
            setTheme({
              light: { ...DEFAULT_THEME.light, ...data.light },
              dark: { ...DEFAULT_THEME.dark, ...data.dark },
            });
          }
        }
      } catch {
        // Use defaults
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTheme();
    return () => { ignore = true; controller.abort(); };
  }, []);

  // Apply theme live as user edits
  const applyLive = useCallback((data: ThemeData) => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const vars = isDark ? data.dark : data.light;
    
    Object.entries(vars).forEach(([key, value]) => {
      const cssVar = CSS_VAR_MAP[key];
      if (cssVar) {
        root.style.setProperty(cssVar, value);
      }
    });
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setTheme((prev) => {
      const next = {
        ...prev,
        [tab]: { ...prev[tab], [key]: value },
      };
      applyLive(next);
      return next;
    });
  }, [tab, applyLive]);

  
  const handleAutoGenerate = useCallback(() => {
    setSaving(true);
    setMessage(null);
    try {
      // Generate theme based on default colors with proper contrast
      const newTheme = {
        light: {
          primary: "#2A5A4A",
          primaryHover: "#234d3f",
          primaryActive: "#1c4034",
          secondary: "#C97A5E",
          secondaryHover: "#b56a4e",
          bg: "#FCFBFA",
          surface0: "#FCFBFA",
          surface1: "#FFFFFF",
          surface2: "#F8F7F5",
          surface3: "#F2F0ED",
          text: "#1a1a1a",
          textSecondary: "#4B5563",
          textMuted: "#6B7280",
          textDisabled: "#9CA3AF",
          border: "#E5E3DF",
          borderStrong: "#D1D5DB",
          // Success status
          successBg: "#DCFCE7",
          successText: "#16A34A",
          successBorder: "#BBF7D0",
          // Error status
          errorBg: "#FEE2E2",
          errorText: "#DC2626",
          errorBorder: "#FECACA",
          // Warning status
          warningBg: "#FEF9C3",
          warningText: "#CA8A04",
          warningBorder: "#FEF08A",
          // Info status
          infoBg: "#DBEAFE",
          infoText: "#2563EB",
          infoBorder: "#BFDBFE",
          // Button variant — solid (base variable, prefix applied by applyLive)
          errorSolidButtonColor: "--app-error-solid-button-color",
          errorSolidButtonBg: "--app-error-solid-button-bg",
          errorSolidButtonBorder: "--app-error-solid-button-border",
          errorSolidButtonColorHover: "--app-error-solid-button-color-hover",
          errorSolidButtonBgHover: "--app-error-solid-button-bg-hover",
          errorSolidButtonBorderHover: "--app-error-solid-button-border-hover",
          errorSolidButtonColorActive: "--app-error-solid-button-color-active",
          errorSolidButtonBgActive: "--app-error-solid-button-bg-active",
          errorSolidButtonBorderActive: "--app-error-solid-button-border-active",
          successSolidButtonColor: "--app-success-solid-button-color",
          successSolidButtonBg: "--app-success-solid-button-bg",
          successSolidButtonBorder: "--app-success-solid-button-border",
          successSolidButtonColorHover: "--app-success-solid-button-color-hover",
          successSolidButtonBgHover: "--app-success-solid-button-bg-hover",
          successSolidButtonBorderHover: "--app-success-solid-button-border-hover",
          successSolidButtonColorActive: "--app-success-solid-button-color-active",
          successSolidButtonBgActive: "--app-success-solid-button-bg-active",
          successSolidButtonBorderActive: "--app-success-solid-button-border-active",
          warningSolidButtonColor: "--app-warning-solid-button-color",
          warningSolidButtonBg: "--app-warning-solid-button-bg",
          warningSolidButtonBorder: "--app-warning-solid-button-border",
          warningSolidButtonColorHover: "--app-warning-solid-button-color-hover",
          warningSolidButtonBgHover: "--app-warning-solid-button-bg-hover",
          warningSolidButtonBorderHover: "--app-warning-solid-button-border-hover",
          warningSolidButtonColorActive: "--app-warning-solid-button-color-active",
          warningSolidButtonBgActive: "--app-warning-solid-button-bg-active",
          warningSolidButtonBorderActive: "--app-warning-solid-button-border-active",
          infoSolidButtonColor: "--app-info-solid-button-color",
          infoSolidButtonBg: "--app-info-solid-button-bg",
          infoSolidButtonBorder: "--app-info-solid-button-border",
          infoSolidButtonColorHover: "--app-info-solid-button-color-hover",
          infoSolidButtonBgHover: "--app-info-solid-button-bg-hover",
          infoSolidButtonBorderHover: "--app-info-solid-button-border-hover",
          infoSolidButtonColorActive: "--app-info-solid-button-color-active",
          infoSolidButtonBgActive: "--app-info-solid-button-bg-active",
          infoSolidButtonBorderActive: "--app-info-solid-button-border-active",
          // Button variant — outline (base variable, prefix applied by applyLive)
          errorOutlineButtonColor: "--app-error-outline-button-color",
          errorOutlineButtonBg: "--app-error-outline-button-bg",
          errorOutlineButtonBorder: "--app-error-outline-button-border",
          errorOutlineButtonColorHover: "--app-error-outline-button-color-hover",
          errorOutlineButtonBgHover: "--app-error-outline-button-bg-hover",
          errorOutlineButtonBorderHover: "--app-error-outline-button-border-hover",
          errorOutlineButtonColorActive: "--app-error-outline-button-color-active",
          errorOutlineButtonBgActive: "--app-error-outline-button-bg-active",
          errorOutlineButtonBorderActive: "--app-error-outline-button-border-active",
          successOutlineButtonColor: "--app-success-outline-button-color",
          successOutlineButtonBg: "--app-success-outline-button-bg",
          successOutlineButtonBorder: "--app-success-outline-button-border",
          successOutlineButtonColorHover: "--app-success-outline-button-color-hover",
          successOutlineButtonBgHover: "--app-success-outline-button-bg-hover",
          successOutlineButtonBorderHover: "--app-success-outline-button-border-hover",
          successOutlineButtonColorActive: "--app-success-outline-button-color-active",
          successOutlineButtonBgActive: "--app-success-outline-button-bg-active",
          successOutlineButtonBorderActive: "--app-success-outline-button-border-active",
          warningOutlineButtonColor: "--app-warning-outline-button-color",
          warningOutlineButtonBg: "--app-warning-outline-button-bg",
          warningOutlineButtonBorder: "--app-warning-outline-button-border",
          warningOutlineButtonColorHover: "--app-warning-outline-button-color-hover",
          warningOutlineButtonBgHover: "--app-warning-outline-button-bg-hover",
          warningOutlineButtonBorderHover: "--app-warning-outline-button-border-hover",
          warningOutlineButtonColorActive: "--app-warning-outline-button-color-active",
          warningOutlineButtonBgActive: "--app-warning-outline-button-bg-active",
          warningOutlineButtonBorderActive: "--app-warning-outline-button-border-active",
          infoOutlineButtonColor: "--app-info-outline-button-color",
          infoOutlineButtonBg: "--app-info-outline-button-bg",
          infoOutlineButtonBorder: "--app-info-outline-button-border",
          infoOutlineButtonColorHover: "--app-info-outline-button-color-hover",
          infoOutlineButtonBgHover: "--app-info-outline-button-bg-hover",
          infoOutlineButtonBorderHover: "--app-info-outline-button-border-hover",
          infoOutlineButtonColorActive: "--app-info-outline-button-color-active",
          infoOutlineButtonBgActive: "--app-info-outline-button-bg-active",
          infoOutlineButtonBorderActive: "--app-info-outline-button-border-active",
        },
        dark: {
          primary: "#3d8b6e",
          primaryHover: "#2A5A4A",
          primaryActive: "#234d3f",
          secondary: "#d4896a",
          secondaryHover: "#C97A5E",
          bg: "#0f1114",
          surface0: "#0f1114",
          surface1: "#181b20",
          surface2: "#1e2127",
          surface3: "#252830",
          text: "#e4e4e7",
          textSecondary: "#a1a1aa",
          textMuted: "#71717a",
          textDisabled: "#52525b",
          border: "#2e3138",
          borderStrong: "#383b42",
          // Success status
          successBg: "rgba(34,197,94,0.12)",
          successText: "#4ade80",
          successBorder: "rgba(34,197,94,0.25)",
          // Error status
          errorBg: "rgba(239,68,68,0.12)",
          errorText: "#f87171",
          errorBorder: "rgba(239,68,68,0.25)",
          // Warning status
          warningBg: "rgba(234,179,8,0.12)",
          warningText: "#facc15",
          warningBorder: "rgba(234,179,8,0.25)",
          // Info status
          infoBg: "rgba(59,130,246,0.12)",
          infoText: "#60a5fa",
          infoBorder: "rgba(59,130,246,0.25)",
          // Button variant — solid (base variable, prefix applied by applyLive)
          errorSolidButtonColor: "--app-error-solid-button-color",
          errorSolidButtonBg: "--app-error-solid-button-bg",
          errorSolidButtonBorder: "--app-error-solid-button-border",
          errorSolidButtonColorHover: "--app-error-solid-button-color-hover",
          errorSolidButtonBgHover: "--app-error-solid-button-bg-hover",
          errorSolidButtonBorderHover: "--app-error-solid-button-border-hover",
          errorSolidButtonColorActive: "--app-error-solid-button-color-active",
          errorSolidButtonBgActive: "--app-error-solid-button-bg-active",
          errorSolidButtonBorderActive: "--app-error-solid-button-border-active",
          successSolidButtonColor: "--app-success-solid-button-color",
          successSolidButtonBg: "--app-success-solid-button-bg",
          successSolidButtonBorder: "--app-success-solid-button-border",
          successSolidButtonColorHover: "--app-success-solid-button-color-hover",
          successSolidButtonBgHover: "--app-success-solid-button-bg-hover",
          successSolidButtonBorderHover: "--app-success-solid-button-border-hover",
          successSolidButtonColorActive: "--app-success-solid-button-color-active",
          successSolidButtonBgActive: "--app-success-solid-button-bg-active",
          successSolidButtonBorderActive: "--app-success-solid-button-border-active",
          warningSolidButtonColor: "--app-warning-solid-button-color",
          warningSolidButtonBg: "--app-warning-solid-button-bg",
          warningSolidButtonBorder: "--app-warning-solid-button-border",
          warningSolidButtonColorHover: "--app-warning-solid-button-color-hover",
          warningSolidButtonBgHover: "--app-warning-solid-button-bg-hover",
          warningSolidButtonBorderHover: "--app-warning-solid-button-border-hover",
          warningSolidButtonColorActive: "--app-warning-solid-button-color-active",
          warningSolidButtonBgActive: "--app-warning-solid-button-bg-active",
          warningSolidButtonBorderActive: "--app-warning-solid-button-border-active",
          infoSolidButtonColor: "--app-info-solid-button-color",
          infoSolidButtonBg: "--app-info-solid-button-bg",
          infoSolidButtonBorder: "--app-info-solid-button-border",
          infoSolidButtonColorHover: "--app-info-solid-button-color-hover",
          infoSolidButtonBgHover: "--app-info-solid-button-bg-hover",
          infoSolidButtonBorderHover: "--app-info-solid-button-border-hover",
          infoSolidButtonColorActive: "--app-info-solid-button-color-active",
          infoSolidButtonBgActive: "--app-info-solid-button-bg-active",
          infoSolidButtonBorderActive: "--app-info-solid-button-border-active",
          // Button variant — outline (base variable, prefix applied by applyLive)
          errorOutlineButtonColor: "--app-error-outline-button-color",
          errorOutlineButtonBg: "--app-error-outline-button-bg",
          errorOutlineButtonBorder: "--app-error-outline-button-border",
          errorOutlineButtonColorHover: "--app-error-outline-button-color-hover",
          errorOutlineButtonBgHover: "--app-error-outline-button-bg-hover",
          errorOutlineButtonBorderHover: "--app-error-outline-button-border-hover",
          errorOutlineButtonColorActive: "--app-error-outline-button-color-active",
          errorOutlineButtonBgActive: "--app-error-outline-button-bg-active",
          errorOutlineButtonBorderActive: "--app-error-outline-button-border-active",
          successOutlineButtonColor: "--app-success-outline-button-color",
          successOutlineButtonBg: "--app-success-outline-button-bg",
          successOutlineButtonBorder: "--app-success-outline-button-border",
          successOutlineButtonColorHover: "--app-success-outline-button-color-hover",
          successOutlineButtonBgHover: "--app-success-outline-button-bg-hover",
          successOutlineButtonBorderHover: "--app-success-outline-button-border-hover",
          successOutlineButtonColorActive: "--app-success-outline-button-color-active",
          successOutlineButtonBgActive: "--app-success-outline-button-bg-active",
          successOutlineButtonBorderActive: "--app-success-outline-button-border-active",
          warningOutlineButtonColor: "--app-warning-outline-button-color",
          warningOutlineButtonBg: "--app-warning-outline-button-bg",
          warningOutlineButtonBorder: "--app-warning-outline-button-border",
          warningOutlineButtonColorHover: "--app-warning-outline-button-color-hover",
          warningOutlineButtonBgHover: "--app-warning-outline-button-bg-hover",
          warningOutlineButtonBorderHover: "--app-warning-outline-button-border-hover",
          warningOutlineButtonColorActive: "--app-warning-outline-button-color-active",
          warningOutlineButtonBgActive: "--app-warning-outline-button-bg-active",
          warningOutlineButtonBorderActive: "--app-warning-outline-button-border-active",
          infoOutlineButtonColor: "--app-info-outline-button-color",
          infoOutlineButtonBg: "--app-info-outline-button-bg",
          infoOutlineButtonBorder: "--app-info-outline-button-border",
          infoOutlineButtonColorHover: "--app-info-outline-button-color-hover",
          infoOutlineButtonBgHover: "--app-info-outline-button-bg-hover",
          infoOutlineButtonBorderHover: "--app-info-outline-button-border-hover",
          infoOutlineButtonColorActive: "--app-info-outline-button-color-active",
          infoOutlineButtonBgActive: "--app-info-outline-button-bg-active",
          infoOutlineButtonBorderActive: "--app-info-outline-button-border-active",
        },
      };
      
      setTheme({
        light: { ...DEFAULT_THEME.light, ...newTheme.light },
        dark: { ...DEFAULT_THEME.dark, ...newTheme.dark },
      });
      applyLive({ light: newTheme.light, dark: newTheme.dark });
      setMessage({ type: "success", text: "Theme auto-generated successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to auto-generate",
      });
    } finally {
      setSaving(false);
    }
  }, []);const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      setMessage({ type: "success", text: "Theme saved successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    applyLive(DEFAULT_THEME);
  };

  if (loading) {
    return (
      <div className="p-6 border border-border rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-2 rounded w-1/3" />
          <div className="h-4 bg-surface-2 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-surface-2 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  {/* Auto Generate button */}
  <div className="flex gap-2 mt-4">
    <button
      onClick={handleAutoGenerate}
      disabled={saving}
      className="px-8 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
    >
      {saving ? "Generating..." : "Auto Generate"}
    </button>
    <button
      onClick={handleReset}
      className="px-8 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface-hover transition-colors"
    >
      Reset
    </button>
  </div>
const currentVars = theme[tab];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["light", "dark"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-white"
                : "bg-surface-2 text-muted hover:bg-surface-3"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} Mode
          </button>
        ))}
      </div>

      {/* Color groups */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.keys.map((key) => (
                <ColorInput
                  key={key}
                  label={LABELS[key]}
                  value={currentVars[key] || ""}
                  onChange={(val) => handleChange(key, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface-hover transition-colors"
        >
          Reset to Defaults
        </button>
        {message && (
          <span className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
