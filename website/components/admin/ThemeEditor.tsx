"use client";

import { useState, useEffect, useCallback } from "react";

interface ThemeValues {
  [key: string]: string;
}

interface ThemeData {
  light: ThemeValues;
  dark: ThemeValues;
  customCss?: string;
}

// ── Button variant helpers ──
const VARIANTS = ["error", "success", "warning", "info"] as const;
const TYPES = ["solid", "outline"] as const;
const PROPS = ["color", "bg", "border"] as const;
const STATES = ["", "Hover", "Active"] as const;

/** Check if a theme key is a button variant key */
function isButtonVariantKey(key: string): boolean {
  return VARIANTS.some(
    (v) => key.startsWith(`${v}SolidButton`) || key.startsWith(`${v}OutlineButton`)
  );
}

/** Build the unprefixed CSS variable base name for a button variant key */
function buttonVariantCssBase(key: string): string {
  // e.g. "errorSolidButtonColor" -> "--app-error-solid-button-color"
  // e.g. "errorSolidButtonColorHover" -> "--app-error-solid-button-color-hover"
  let variant = "";
  let type = "";
  for (const v of VARIANTS) {
    if (key.startsWith(`${v}Solid`) || key.startsWith(`${v}Outline`)) {
      variant = v;
      type = key.startsWith(`${v}Solid`) ? "solid" : "outline";
      break;
    }
  }
  // Remove variant prefix + "Solid"/"Outline" + "Button"
  const suffix = key.slice(`${variant}${type.charAt(0).toUpperCase() + type.slice(1)}Button`.length);
  // suffix is like "Color", "Bg", "Border", "ColorHover", "BgHover", etc.
  const prop = suffix.replace(/(Hover|Active)$/, "");
  const state = suffix.endsWith("Hover") ? "-hover" : suffix.endsWith("Active") ? "-active" : "";
  return `--app-${variant}-${type}-button-${prop.toLowerCase()}${state}`;
}

// Generate button variant default values for a given theme mode
function generateButtonDefaults(baseColors: Record<string, string>, mode: "light" | "dark"): ThemeValues {
  const result: ThemeValues = {};
  const variants = VARIANTS.map((v) => ({
    name: v,
    text: baseColors[`${v}Text`] || "",
    bg: baseColors[`${v}Bg`] || "",
    border: baseColors[`${v}Border`] || "",
  }));

  for (const { name: v, text, bg, border } of variants) {
    for (const type of TYPES) {
      for (const prop of PROPS) {
        for (const state of STATES) {
          const suffix = `${state}`;
          const key = `${v}${type.charAt(0).toUpperCase() + type.slice(1)}Button${prop.charAt(0).toUpperCase() + prop.slice(1)}${suffix}`;

          if (type === "solid") {
            // Solid: colored bg, text-colored text
            if (prop === "color") {
              result[key] = state === "" ? text : text; // same in all states
            } else if (prop === "bg") {
              result[key] = state === "" ? bg : "transparent"; // bg in base, transparent in hover/active
            } else {
              // border
              result[key] = state === "" ? border : border; // same in all states
            }
          } else {
            // Outline: transparent bg, colored text/border
            if (prop === "color") {
              result[key] = text;
            } else if (prop === "bg") {
              result[key] = "transparent";
            } else {
              // border
              result[key] = border;
            }
          }
        }
      }
    }
  }
  return result;
}

/**
 * Generate ALL derived CSS variables from base theme colors.
 * This includes:
 * - Button variants (solid/outline for error, success, warning, info)
 * - AppKit theme variables (--apkt-colors-*)
 * - Derived text/bg/border variants with opacity
 */
function generateAllDerivedVars(
  baseColors: Record<string, string>,
  buttonDefaults: ThemeValues
): Record<string, string> {
  const all: Record<string, string> = {};
  const primary = baseColors.primary || "#3d8b6e";
  const secondary = baseColors.secondary || "#d4896a";
  const bg = baseColors.bg || "#0f1114";
  const text = baseColors.text || "#e4e4e7";
  const border = baseColors.border || "#2e3138";

  // ── Helper: parse hex to rgb ──
  function hexToRgb(hex: string): [number, number, number] | null {
    const h = hex.replace("#", "");
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return [r, g, b];
    }
    if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return [r, g, b];
    }
    return null;
  }

  function rgba(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  // ── AppKit theme variables ──
  all["--apkt-colors-accent"] = primary;
  all["--apkt-colors-accent-secondary"] = secondary;
  all["--apkt-colors-success"] = baseColors.successText || "#4ade80";
  all["--apkt-colors-error"] = baseColors.errorText || "#f87171";
  all["--apkt-colors-warning"] = baseColors.warningText || "#facc15";
  all["--apkt-colors-info"] = baseColors.infoText || "#60a5fa";
  all["--apkt-colors-background"] = bg;
  all["--apkt-colors-foreground"] = text;
  all["--apkt-colors-foreground-inverse"] = baseColors.surface1 || "#181b20";
  all["--apkt-colors-border"] = border;

  // ── AppKit accent opacity scale ──
  const accentRgb = hexToRgb(primary);
  if (accentRgb) {
    for (let i = 1; i <= 10; i++) {
      const alpha = i / 10;
      all[`--apkt-colors-accent0${i * 10}`] = `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, ${alpha})`;
    }
  }

  // ── AppKit accent secondary opacity scale ──
  const secRgb = hexToRgb(secondary);
  if (secRgb) {
    for (let i = 1; i <= 10; i++) {
      const alpha = i / 10;
      all[`--apkt-colors-accentSecondary0${i * 10}`] = `rgba(${secRgb[0]}, ${secRgb[1]}, ${secRgb[2]}, ${alpha})`;
    }
  }

  // ── AppKit semantic opacity scales ──
  const semanticScales: [string, string][] = [
    ["semanticSuccess", baseColors.successText || "#4ade80"],
    ["semanticError", baseColors.errorText || "#f87171"],
    ["semanticWarning", baseColors.warningText || "#facc15"],
  ];
  for (const [scaleName, color] of semanticScales) {
    const rgb = hexToRgb(color);
    if (rgb) {
      for (let i = 1; i <= 10; i++) {
        const alpha = i / 10;
        all[`--apkt-colors-${scaleName}0${i * 10}`] = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
      }
    }
  }

  // ── AppKit neutrals ──
  const neutralBase = hexToRgb(bg) || [15, 17, 20];
  for (let i = 50; i <= 1000; i += 50) {
    const step = Math.min(i / 1000, 1);
    const r = Math.round(neutralBase[0] + (246 - neutralBase[0]) * (1 - step));
    const g = Math.round(neutralBase[1] + (246 - neutralBase[1]) * (1 - step));
    const b = Math.round(neutralBase[2] + (246 - neutralBase[2]) * (1 - step));
    all[`--apkt-colors-neutrals${i}`] = `rgb(${r}, ${g}, ${b})`;
  }

  // ── Product colors (static) ──
  all["--apkt-colors-productWalletKit"] = "#FFB800";
  all["--apkt-colors-productAppKit"] = "#FF573B";
  all["--apkt-colors-productCloud"] = "#0988F0";
  all["--apkt-colors-productDocumentation"] = "#008847";

  // ── Black/White ──
  all["--apkt-colors-black"] = "#202020";
  all["--apkt-colors-white"] = "#FFFFFF";
  all["--apkt-colors-white010"] = "rgba(255, 255, 255, 0.1)";

  return all;
}

// ── Base defaults (without button variants) ──
const LIGHT_BASE: ThemeValues = {
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
};

const DARK_BASE: ThemeValues = {
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
};

const DEFAULT_THEME: ThemeData = {
  light: { ...LIGHT_BASE, ...generateButtonDefaults(LIGHT_BASE, "light") },
  dark: { ...DARK_BASE, ...generateButtonDefaults(DARK_BASE, "dark") },
};

// ── Map theme keys to CSS variable names ──
// Base keys map directly. Button variant keys map to unprefixed --app-* names;
// applyLive() handles --light--app-* / --dark--app-* prefixing for button variants.
const CSS_VAR_MAP: Record<string, string> = {
  // Brand
  primary: "--app-primary",
  primaryHover: "--app-primary-hover",
  primaryActive: "--app-primary-active",
  secondary: "--app-secondary",
  secondaryHover: "--app-secondary-hover",
  // Surfaces
  bg: "--app-bg",
  surface0: "--app-surface-0",
  surface1: "--app-surface-1",
  surface2: "--app-surface-2",
  surface3: "--app-surface-3",
  // Text
  text: "--app-text",
  textSecondary: "--app-text-secondary",
  textMuted: "--app-text-muted",
  textDisabled: "--app-text-disabled",
  // Borders
  border: "--app-border",
  borderStrong: "--app-border-strong",
  // Status
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

// Auto-generate button variant CSS_VAR_MAP entries
for (const variant of VARIANTS) {
  for (const type of TYPES) {
    for (const prop of PROPS) {
      for (const state of STATES) {
        const suffix = `${state}`;
        const key = `${variant}${type.charAt(0).toUpperCase() + type.slice(1)}Button${prop.charAt(0).toUpperCase() + prop.slice(1)}${suffix}`;
        const statePart = state ? `-${state.toLowerCase()}` : "";
        CSS_VAR_MAP[key] = `--app-${variant}-${type}-button-${prop.toLowerCase()}${statePart}`;
      }
    }
  }
}

// ── Human-readable labels ──
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

// Auto-generate button variant labels
const PROP_LABELS: Record<string, string> = { color: "Text", bg: "BG", border: "Border" };
const STATE_LABELS: Record<string, string> = { "": "Default", Hover: "Hover", Active: "Active" };

for (const variant of VARIANTS) {
  for (const type of TYPES) {
    for (const prop of PROPS) {
      for (const state of STATES) {
        const suffix = `${state}`;
        const key = `${variant}${type.charAt(0).toUpperCase() + type.slice(1)}Button${prop.charAt(0).toUpperCase() + prop.slice(1)}${suffix}`;
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        const variantLabel = variant.charAt(0).toUpperCase() + variant.slice(1);
        LABELS[key] = `${variantLabel} ${typeLabel} - ${PROP_LABELS[prop]} (${STATE_LABELS[state]})`;
      }
    }
  }
}

// ── Groups for organized display ──
function makeButtonGroup(variant: string, type: string) {
  const variantLabel = variant.charAt(0).toUpperCase() + variant.slice(1);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const keys: string[] = [];
  for (const prop of PROPS) {
    for (const state of STATES) {
      const suffix = `${state}`;
      keys.push(`${variant}${type.charAt(0).toUpperCase() + type.slice(1)}Button${prop.charAt(0).toUpperCase() + prop.slice(1)}${suffix}`);
    }
  }
  return { label: `${variantLabel} ${typeLabel} Button`, keys };
}

const BUTTON_GROUPS = VARIANTS.flatMap((v) =>
  TYPES.map((t) => makeButtonGroup(v, t))
);

const GROUPS = [
  { label: "Brand", keys: ["primary", "primaryHover", "primaryActive", "secondary", "secondaryHover"] },
  { label: "Surfaces", keys: ["bg", "surface0", "surface1", "surface2", "surface3"] },
  { label: "Text", keys: ["text", "textSecondary", "textMuted", "textDisabled"] },
  { label: "Borders", keys: ["border", "borderStrong"] },
  { label: "Success Status", keys: ["successBg", "successText", "successBorder"] },
  { label: "Error Status", keys: ["errorBg", "errorText", "errorBorder"] },
  { label: "Warning Status", keys: ["warningBg", "warningText", "warningBorder"] },
  { label: "Info Status", keys: ["infoBg", "infoText", "infoBorder"] },
  ...BUTTON_GROUPS,
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

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted w-32 shrink-0" style={{ minWidth: "16rem" }}>{label}</label>
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
  const [customCss, setCustomCss] = useState("");
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
          if (data.customCss) {
            setCustomCss(data.customCss);
          }
        }
      } catch {
        // Use defaults
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTheme();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  // Apply theme live as user edits — only for the active mode
  const applyLive = useCallback((data: ThemeData) => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const activeMode = isDark ? "dark" : "light";
    const vars = isDark ? data.dark : data.light;
    const prefix = `--${activeMode}--`;

    // Apply base + button variant CSS variables for active mode only
    Object.entries(vars).forEach(([key, value]) => {
      const cssVar = CSS_VAR_MAP[key];
      if (cssVar) {
        if (isButtonVariantKey(key)) {
          // Button variants: set only for the active mode
          root.style.setProperty(cssVar.replace("--app-", prefix + "app-"), value);
        } else {
          // Base variables: set directly
          root.style.setProperty(cssVar, value);
        }
      }
    });

    // Apply derived AppKit + semantic variables
    const lightBase = extractBaseFromData(data, "light");
    const darkBase = extractBaseFromData(data, "dark");
    const activeBase = isDark ? darkBase : lightBase;
    const buttonVars = generateButtonDefaults(activeBase, isDark ? "dark" : "light");
    const derived = generateAllDerivedVars(activeBase, buttonVars);
    Object.entries(derived).forEach(([cssVar, value]) => {
      root.style.setProperty(cssVar, value);
    });
  }, []);

  const handleChange = useCallback(
    (key: string, value: string) => {
      setTheme((prev) => {
        const next = {
          ...prev,
          [tab]: { ...prev[tab], [key]: value },
        };
        applyLive(next);
        return next;
      });
    },
    [tab, applyLive]
  );

  /** Extract only base colors (non-button keys) from a theme mode */
  const extractBaseColors = (mode: "light" | "dark"): Record<string, string> => {
    const base: Record<string, string> = {};
    for (const key of Object.keys(theme[mode])) {
      if (!isButtonVariantKey(key)) {
        base[key] = theme[mode][key];
      }
    }
    return base;
  };

  /** Extract base colors from ThemeData for a given mode */
  function extractBaseFromData(data: ThemeData, mode: "light" | "dark"): Record<string, string> {
    const base: Record<string, string> = {};
    for (const key of Object.keys(data[mode])) {
      if (!isButtonVariantKey(key)) {
        base[key] = data[mode][key];
      }
    }
    return base;
  }

  /** Regenerate all button variant values from current base colors */
  const handleRegenerateButtons = useCallback(() => {
    setSaving(true);
    setMessage(null);
    try {
      const lightBase = extractBaseColors("light");
      const darkBase = extractBaseColors("dark");

      const newTheme: ThemeData = {
        light: { ...lightBase, ...generateButtonDefaults(lightBase, "light") },
        dark: { ...darkBase, ...generateButtonDefaults(darkBase, "dark") },
      };

      setTheme(newTheme);
      applyLive(newTheme);
      setMessage({ type: "success", text: "Button variants regenerated from current colors" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to regenerate",
      });
    } finally {
      setSaving(false);
    }
  }, [applyLive, theme]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, customCss }),
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
    setCustomCss("");
    applyLive(DEFAULT_THEME);
    // Remove injected custom CSS
    if (typeof document !== "undefined") {
      const el = document.getElementById("gofetch-admin-custom-css");
      if (el) el.remove();
    }
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
                  label={LABELS[key] || key}
                  value={currentVars[key] || ""}
                  onChange={(val) => handleChange(key, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom CSS */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
          Custom CSS Override
        </h3>
        <p className="text-xs text-muted mb-3">
          Enter any CSS to override styles. This loads after all other stylesheets and takes highest priority.
        </p>
        <textarea
          value={customCss}
          onChange={(e) => setCustomCss(e.target.value)}
          placeholder={`/* Example: */\n.bg-primary {\n  background-color: #10b981 !important;\n}\n.text-primary {\n  color: #10b981 !important;\n}`}
          rows={8}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          spellCheck={false}
        />
        <button
          onClick={async () => {
            setSaving(true);
            setMessage(null);
            try {
              const res = await fetch("/api/admin/theme", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...theme, customCss }),
              });
              if (!res.ok) throw new Error("Failed to save");
              setMessage({ type: "success", text: "Custom CSS saved — reloading..." });
              setTimeout(() => window.location.reload(), 600);
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
              setSaving(false);
            }
          }}
          disabled={saving}
          className="mt-3 px-6 py-2.5 bg-success text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Custom & Reload"}
        </button>
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
          onClick={handleRegenerateButtons}
          disabled={saving}
          className="px-8 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {saving ? "Regenerating..." : "Regenerate Buttons"}
        </button>
        <button
          onClick={() => {
            setSaving(true);
            setMessage(null);
            try {
              // Regenerate button variants from current base colors
              const lightBase = extractBaseColors("light");
              const darkBase = extractBaseColors("dark");
              const newTheme: ThemeData = {
                light: { ...lightBase, ...generateButtonDefaults(lightBase, "light") },
                dark: { ...darkBase, ...generateButtonDefaults(darkBase, "dark") },
              };
              setTheme(newTheme);
              applyLive(newTheme);
              setMessage({ type: "success", text: "All CSS variables generated from current theme colors" });
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" });
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="px-8 py-2.5 bg-success text-white rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Generating..." : "Generate All CSS"}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface-hover transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify({ ...theme, customCss }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gofetch-theme-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage({ type: "success", text: "Theme JSON downloaded" });
          }}
          className="px-6 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface-hover transition-colors"
        >
          Download JSON
        </button>
        <label
          className="px-6 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Upload JSON
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                if (!parsed.light || !parsed.dark) {
                  setMessage({ type: "error", text: "Invalid theme JSON — must have light and dark keys" });
                  return;
                }
                const newTheme: ThemeData = {
                  light: { ...DEFAULT_THEME.light, ...parsed.light },
                  dark: { ...DEFAULT_THEME.dark, ...parsed.dark },
                  customCss: parsed.customCss || "",
                };
                setTheme(newTheme);
                if (parsed.customCss) setCustomCss(parsed.customCss);
                applyLive(newTheme);
                // Auto-save to database
                const res = await fetch("/api/admin/theme", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newTheme),
                });
                if (!res.ok) throw new Error("Failed to save");
                setMessage({ type: "success", text: "Theme uploaded and saved" });
              } catch (err) {
                setMessage({ type: "error", text: err instanceof Error ? err.message : "Invalid JSON" });
              }
            }}
          />
        </label>
        {message && (
          <span className={`text-sm ${message.type === "success" ? "text-success" : "text-error"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
