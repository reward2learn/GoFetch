"use client";

import { useState, useRef, useEffect, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, X } from "lucide-react";

/* ─── Types ─── */

export interface AutocompleteOption<V = string> {
  value: V;
  label: string;
}

interface AutocompleteProps<V = string> {
  options: AutocompleteOption<V>[];
  /** Current selected value (single mode) or values (multiple mode) */
  value: V | V[];
  /** Fired with the new value(s) when the user selects or clears */
  onChange: (value: V | V[]) => void;
  /** Placeholder shown when nothing is selected / search is empty */
  placeholder?: string;
  /** Display label for the field (optional, shown above input) */
  label?: string;
  /** Enable multi-select chips mode */
  multiple?: boolean;
  /** Show a clear (X) button to reset selection */
  clearable?: boolean;
  /** Disable the control */
  disabled?: boolean;
  /** Custom class for the root wrapper */
  className?: string;
  /** Compact size for filter bars */
  size?: "default" | "small";
  /** Render option override — receives option, isSelected, and a ref callback */
  renderOption?: (
    option: AutocompleteOption<V>,
    isSelected: boolean,
    onSelect: () => void
  ) => React.ReactNode;
}

/* ─── Component ─── */

export function Autocomplete<V extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  multiple = false,
  clearable = false,
  disabled = false,
  className,
  size = "default",
  renderOption,
}: AutocompleteProps<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  /* ── Helpers ── */

  const selectedValues: V[] = useMemo(() => {
    if (multiple) return (value as V[]) || [];
    return value ? [value as V] : [];
  }, [value, multiple]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedValues.includes(o.value)),
    [options, selectedValues]
  );

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const isSelected = (optValue: V) => selectedValues.includes(optValue);

  /* ── Outside-click close ── */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Actions ── */

  const selectOption = (opt: AutocompleteOption<V>) => {
    if (multiple) {
      const current = selectedValues.slice();
      const idx = current.indexOf(opt.value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(opt.value);
      onChange(current);
    } else {
      onChange(opt.value);
      setOpen(false);
    }
    setQuery("");
    setActiveIndex(-1);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(multiple ? [] : ("" as V));
    setQuery("");
  };

  const removeChip = (e: React.MouseEvent, chipValue: V) => {
    e.stopPropagation();
    e.preventDefault();
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== chipValue));
    } else {
      onChange("" as V);
    }
  };

  /* ── Display text for single mode ── */

  const singleLabel = selectedOptions.length > 0 ? selectedOptions[0].label : "";

  /* ── Keyboard nav ── */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        selectOption(filteredOptions[activeIndex]);
      } else {
        setOpen(true);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    } else if (e.key === "Backspace" && !query && selectedValues.length > 0) {
      // Remove last chip on backspace in multi mode
      if (multiple) onChange(selectedValues.slice(0, -1));
    }
  };

  /* ── Sizes ── */

  const inputClasses = cn(
    "w-full bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
    size === "small" ? "px-3 py-1.5" : "px-4 py-2",
    disabled && "opacity-50 cursor-not-allowed",
    open && "ring-2 ring-primary"
  );

  const hasValue = selectedValues.length > 0;
  const showClear = clearable && hasValue && !disabled;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}

      {/* Input / trigger */}
      <div
        className={cn(inputClasses, "flex items-center gap-2 cursor-pointer min-h-[38px]", open && "ring-2 ring-primary")}
        onClick={() => { if (!disabled) { setOpen(!open); inputRef.current?.focus(); } }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Chips (multi mode) */}
        {multiple && hasValue ? (
          <div className="flex flex-wrap items-center gap-1 flex-1">
            {selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/15 text-primary rounded text-xs font-medium"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeChip(e, opt.value)}
                  className="hover:bg-primary/25 rounded-full p-0.5"
                  aria-label={`Remove ${opt.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : !open ? (
          /* Single mode: show selected label, or placeholder */
          <span className={cn("flex-1 truncate", !hasValue && "text-muted")}>
            {hasValue ? singleLabel : placeholder}
          </span>
        ) : null}

        {/* Search input (visible when open) */}
        {open && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder={multiple && hasValue ? "Search..." : hasValue ? singleLabel : placeholder}
            className="flex-1 bg-transparent outline-none text-sm font-normal placeholder:text-muted min-w-0"
            autoFocus
          />
        )}

        {/* Clear button */}
        {showClear && !open && (
          <button
            type="button"
            onClick={clearAll}
            className="text-muted hover:text-primary shrink-0 p-0.5"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Chevron */}
        <ChevronDown
          className={cn("w-4 h-4 text-muted shrink-0 transition-transform", open && "rotate-180")}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-surface-1 border border-border rounded-lg shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-muted text-center">No options</li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const selected = isSelected(opt.value);
              const active = idx === activeIndex;
              return (
                <li key={opt.value} role="option" aria-selected={selected}>
                  {renderOption ? (
                    renderOption(opt, selected, () => selectOption(opt))
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors",
                        active ? "bg-surface-hover" : "hover:bg-surface-hover",
                        selected && "text-primary font-medium"
                      )}
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      {selected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                    </button>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default Autocomplete;
