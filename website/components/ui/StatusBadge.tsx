import { cn } from "@/lib/utils";

type Status = "open" | "offered" | "agreed" | "funded" | "purchased" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-600" },
  offered: { label: "Offered", color: "bg-yellow-50 text-yellow-600" },
  agreed: { label: "Agreed", color: "bg-purple-50 text-purple-600" },
  funded: { label: "Funded", color: "bg-indigo-50 text-indigo-600" },
  purchased: { label: "Purchased", color: "bg-cyan-50 text-cyan-600" },
  in_transit: { label: "In Transit", color: "bg-orange-50 text-orange-600" },
  delivered: { label: "Delivered", color: "bg-green-50 text-green-600" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
  disputed: { label: "Disputed", color: "bg-red-50 text-red-600" },
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
