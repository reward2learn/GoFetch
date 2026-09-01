"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand-primary text-white hover:bg-brand-400":
              variant === "primary",
            "bg-secondary-300 text-white hover:bg-secondary-400":
              variant === "secondary",
            "border border-border bg-white text-brand-primary hover:bg-surface-2":
              variant === "outline",
            "bg-transparent text-brand-primary hover:bg-surface-2":
              variant === "ghost",
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
