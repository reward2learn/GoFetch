import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses = {
  default: "bg-surface-tertiary text-muted",
  success: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-600",
  error: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-600",
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
