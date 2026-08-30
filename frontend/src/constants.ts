export const CATEGORIES = ["All", "Beauty", "Electronics", "Fashion", "Other"] as const;

export const POST_CATEGORIES = ["Beauty", "Electronics", "Fashion", "Other"] as const;

export { ALL_COUNTRIES as COUNTRIES } from "./locations";

export const CATEGORY_ICON: Record<string, string> = {
  Beauty: "sparkles-outline",
  Electronics: "hardware-chip-outline",
  Fashion: "shirt-outline",
  Other: "cube-outline",
  All: "grid-outline",
};

export type OrderStatus =
  | "offered"
  | "agreed"
  | "funded"
  | "purchased"
  | "in_transit"
  | "arrived"
  | "completed"
  | "disputed"
  | "cancelled"
  | "rejected";

export const STATUS_STEPS: OrderStatus[] = [
  "agreed",
  "funded",
  "purchased",
  "in_transit",
  "arrived",
  "completed",
];

export const STATUS_LABEL: Record<string, string> = {
  offered: "Offer sent",
  agreed: "Agreed",
  funded: "Escrow funded",
  purchased: "Item purchased",
  in_transit: "In transit",
  arrived: "Arrived",
  completed: "Completed",
  disputed: "In dispute",
  cancelled: "Cancelled",
  rejected: "Declined",
};

export const STATUS_STEP_LABEL: Record<string, string> = {
  agreed: "Agreed",
  funded: "Escrow Funded",
  purchased: "Purchased",
  in_transit: "In Transit",
  arrived: "Arrived",
  completed: "Handoff & Payout",
};

export function statusColor(status: string): "brand" | "success" | "warning" | "error" | "muted" {
  if (status === "completed") return "success";
  if (["disputed", "cancelled", "rejected"].includes(status)) return "error";
  if (["offered", "agreed"].includes(status)) return "warning";
  return "brand";
}
