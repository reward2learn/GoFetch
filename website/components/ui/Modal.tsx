"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",  // 24rem / 384px
  md: "max-w-md",  // 28rem / 448px (default)
  lg: "max-w-2xl", // 42rem / 672px
  xl: "max-w-4xl", // 56rem / 896px
  full: "max-w-6xl", // 72rem / 1152px
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Width preset. Defaults to "md" (max-w-md). */
  size?: ModalSize;
}

export function Modal({ isOpen, onClose, title, children, footer, className, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "bg-surface-1 rounded-lg shadow-xl w-full animate-in fade-in zoom-in-95 flex flex-col",
          MODAL_SIZE_CLASSES[size],
          className
        )}
        style={{ maxHeight: "min(calc(86vh - 44px), calc(100dvh - 120px))" }}
      >
        {/* Header — fixed ~61px */}
        {title && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-auto p-4" style={{ maxHeight: "min(calc(86vh - 162px), calc(100dvh - 200px))" }}>
          {children}
        </div>

        {/* Footer — fixed ~61px */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
