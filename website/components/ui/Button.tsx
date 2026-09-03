"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "error" | "success" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  buttonType?: "solid" | "outline";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, buttonType = "solid", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-on-primary hover:bg-primary-hover":
              variant === "primary",
            "bg-secondary-300 text-on-primary hover:bg-secondary-400":
              variant === "secondary",
            "border border-border bg-surface-1 text-primary-color hover:bg-surface-2":
              variant === "outline",
            "bg-transparent text-primary-color hover:bg-surface-2":
              variant === "ghost",
            // Error solid
            "var(--light--app-error-solid-button-color) var(--light--app-error-solid-button-bg) var(--light--app-error-solid-button-border) hover:var(--light--app-error-solid-button-color-hover) hover:var(--light--app-error-solid-button-bg-hover) hover:var(--light--app-error-solid-button-border-hover) active:var(--light--app-error-solid-button-color-active) active:var(--light--app-error-solid-button-bg-active) active:var(--light--app-error-solid-button-border-active)":
              variant === "error" && buttonType === "solid",
            // Error outline
            "var(--light--app-error-outline-button-color) transparent var(--light--app-error-outline-button-border) hover:var(--light--app-error-outline-button-color-hover) hover:transparent hover:var(--light--app-error-outline-button-border-hover) active:var(--light--app-error-outline-button-color-active) active:transparent active:var(--light--app-error-outline-button-border-active)":
              variant === "error" && buttonType === "outline",
            // Success solid
            "var(--light--app-success-solid-button-color) var(--light--app-success-solid-button-bg) var(--light--app-success-solid-button-border) hover:var(--light--app-success-solid-button-color-hover) hover:var(--light--app-success-solid-button-bg-hover) hover:var(--light--app-success-solid-button-border-hover) active:var(--light--app-success-solid-button-color-active) active:var(--light--app-success-solid-button-bg-active) active:var(--light--app-success-solid-button-border-active)":
              variant === "success" && buttonType === "solid",
            // Success outline
            "var(--light--app-success-outline-button-color) transparent var(--light--app-success-outline-button-border) hover:var(--light--app-success-outline-button-color-hover) hover:transparent hover:var(--light--app-success-outline-button-border-hover) active:var(--light--app-success-outline-button-color-active) active:transparent active:var(--light--app-success-outline-button-border-active)":
              variant === "success" && buttonType === "outline",
            // Warning solid
            "var(--light--app-warning-solid-button-color) var(--light--app-warning-solid-button-bg) var(--light--app-warning-solid-button-border) hover:var(--light--app-warning-solid-button-color-hover) hover:var(--light--app-warning-solid-button-bg-hover) hover:var(--light--app-warning-solid-button-border-hover) active:var(--light--app-warning-solid-button-color-active) active:var(--light--app-warning-solid-button-bg-active) active:var(--light--app-warning-solid-button-border-active)":
              variant === "warning" && buttonType === "solid",
            // Warning outline
            "var(--light--app-warning-outline-button-color) transparent var(--light--app-warning-outline-button-border) hover:var(--light--app-warning-outline-button-color-hover) hover:transparent hover:var(--light--app-warning-outline-button-border-hover) active:var(--light--app-warning-outline-button-color-active) active:transparent active:var(--light--app-warning-outline-button-border-active)":
              variant === "warning" && buttonType === "outline",
            // Info solid
            "var(--light--app-info-solid-button-color) var(--light--app-info-solid-button-bg) var(--light--app-info-solid-button-border) hover:var(--light--app-info-solid-button-color-hover) hover:var(--light--app-info-solid-button-bg-hover) hover:var(--light--app-info-solid-button-border-hover) active:var(--light--app-info-solid-button-color-active) active:var(--light--app-info-solid-button-bg-active) active:var(--light--app-info-solid-button-border-active)":
              variant === "info" && buttonType === "solid",
            // Info outline
            "var(--light--app-info-outline-button-color) transparent var(--light--app-info-outline-button-border) hover:var(--light--app-info-outline-button-color-hover) hover:transparent hover:var(--light--app-info-outline-button-border-hover) active:var(--light--app-info-outline-button-color-active) active:transparent active:var(--light--app-info-outline-button-border-active)":
              variant === "info" && buttonType === "outline",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
