import { cn } from "@/lib/utils";

type Status = "open" | "offered" | "agreed" | "funded" | "purchased" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-info text-info" },
  offered: { label: "Offered", color: "bg-warning text-warning" },
  agreed: { label: "Agreed", color: "bg-purple-50 text-purple-600" },
  funded: { label: "Funded", color: "bg-indigo-50 text-indigo-600" },
  purchased: { label: "Purchased", color: "bg-cyan-50 text-cyan-600" },
  in_transit: { label: "In Transit", color: "bg-orange-50 text-orange-600" },
  delivered: { label: "Delivered", color: "bg-success text-success" },
  completed: { label: "Completed", color: "bg-success text-success" },
  cancelled: { label: "Cancelled", color: "bg-surface-2 text-secondary" },
  disputed: { label: "Disputed", color: "bg-error text-error" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full text-xs px-2 py-1",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
