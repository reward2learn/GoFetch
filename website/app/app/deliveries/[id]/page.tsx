"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import StripeCheckoutButton from "@/components/payments/StripeCheckoutButton";
import { useAppSelector } from "@/redux/hooks";
import { ArrowLeft, MapPin, Tag, Package, Truck, CheckCircle2, ChevronDown, MessageSquare } from "lucide-react";

const TRAVELER_STATUS_FLOW = [
  "agreed",
  "funded",
  "purchased",
  "in_transit",
  "arrived",
  "handoff_pending",
  "completed",
] as const;

const STATUS_LABELS: Record<string, string> = {
  offered: "Offered",
  agreed: "Agreed",
  funded: "Funded",
  purchased: "Purchased",
  in_transit: "In Transit",
  arrived: "Arrived",
  handoff_pending: "Handoff Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
  refunded: "Refunded",
  released: "Released",
};

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
    case "released":
      return "bg-success text-success";
    case "in_transit":
    case "arrived":
      return "bg-info text-info";
    case "funded":
    case "purchased":
    case "handoff_pending":
      return "bg-success text-success";
    case "cancelled":
    case "disputed":
    case "refunded":
      return "bg-error text-error";
    case "offered":
    case "agreed":
      return "bg-warning text-warning";
    default:
      return "bg-surface-2 text-muted";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
    case "released":
      return <CheckCircle2 className="h-4 w-4" />;
    case "in_transit":
    case "arrived":
      return <Truck className="h-4 w-4" />;
    case "funded":
    case "purchased":
    case "handoff_pending":
      return <Package className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/deliveries/${params.id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Delivery not found");
        const data = await res.json();
        if (!ignore) setOrder(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load delivery");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchOrder();
    return () => { ignore = true; controller.abort(); };
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/deliveries/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      const updated = await res.json();
      setOrder(updated);
      setToast({ message: `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`, type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to update status", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextStatus = (): string | null => {
    if (!order) return null;
    const currentIdx = TRAVELER_STATUS_FLOW.indexOf(order.status);
    if (currentIdx === -1 || currentIdx >= TRAVELER_STATUS_FLOW.length - 1) return null;
    return TRAVELER_STATUS_FLOW[currentIdx + 1];
  };

  const isTraveler = authUser?.id === order?.travelerId;
  const request = order?.request;
  const image = request?.imageUrl || "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=500&fit=crop";
  const itemPrice = parseFloat(order?.itemPrice?.toString() || "0");
  const reward = parseFloat(order?.reward?.toString() || "0");
  const nextStatus = getNextStatus();

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-surface-2 rounded-2xl" />
          <div className="h-8 bg-surface-2 rounded w-1/2" />
          <div className="h-4 bg-surface-2 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <p className="text-muted mb-4">{error || "Delivery not found"}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* ── PRODUCT VIEW ── */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* ─── LEFT: Image ─── */}
          <div className="md:w-[45%] shrink-0">
            <div className="relative aspect-[3/4] min-h-[300px] md:min-h-[300px] rounded-2xl overflow-hidden bg-surface-2" style={{ maxHeight: "400px" }}>
              <img
                src={image}
                alt={request?.title || "Delivery item"}
                className="w-full h-full object-cover"
              />

              {/* Category badge — top left */}
              <span className="absolute top-4 left-4 text-xs font-medium px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white shadow-sm">
                {request?.category || "Other"}
              </span>

              {/* Reward badge — top right */}
              <span className="absolute top-4 right-4 text-sm font-bold px-3.5 py-1.5 bg-primary text-white rounded-full shadow-sm">
                +{formatCurrency(reward)}
              </span>
            </div>
          </div>

          {/* ─── RIGHT: Details ─── */}
          <div className="md:w-[55%] flex flex-col justify-center">
            {/* Click & Collect badge */}
            {request?.deliveryType === "click_and_collect" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-3 text-primary rounded-full text-sm font-medium mb-3 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
                Click & Collect
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3 leading-tight">
              {request?.title || `Order #${order.id.slice(0, 8)}`}
            </h1>

            {/* Description */}
            {request?.description && (
              <p className="text-secondary text-base leading-relaxed mb-6">
                {request.description}
              </p>
            )}

            {/* Metadata rows */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted" />
                  From
                </span>
                <span className="text-sm font-medium text-primary">
                  {request?.fromCity}, {request?.fromCountry}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted" />
                  To
                </span>
                <span className="text-sm font-medium text-primary">
                  {request?.toCity}, {request?.toCountry}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  Status
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                  {STATUS_LABELS[order.status] || order.status?.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-6" />

            {/* Buyer info */}
            <div className="mb-6">
              <p className="text-sm text-muted mb-2">Buyer</p>
              <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-primary font-semibold text-sm">
                  {order.buyer?.name?.charAt(0) || "B"}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    {order.buyer?.name || "Buyer"}
                  </p>
                  {order.buyer?.walletAddress && (
                    <p className="text-xs text-muted">
                      {order.buyer.walletAddress.slice(0, 6)}...{order.buyer.walletAddress.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="mb-6">
              {request?.deliveryType === "click_and_collect" ? (
                <>
                  <p className="text-sm text-muted mb-1">Pickup Fee</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(reward)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted">Item Price</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(itemPrice)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">Delivery Reward</p>
                    <p className="text-xl font-bold text-success">
                      +{formatCurrency(reward)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Pickup location (click & collect only) */}
            {request?.deliveryType === "click_and_collect" && request?.pickupLocation && (
              <div className="mb-4">
                <label className="block text-sm text-muted mb-2">Pick-up at the airport</label>
                <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border border-border rounded-xl">
                  <span className="text-sm font-medium text-primary">{request.pickupLocation}</span>
                  <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                </div>
              </div>
            )}

            {/* Pickup instructions (click & collect only) */}
            {request?.deliveryType === "click_and_collect" && request?.pickupInstructions && (
              <div className="flex items-start gap-2 mb-6">
                <p className="text-sm text-muted leading-relaxed">{request.pickupInstructions}</p>
              </div>
            )}

            {/* ── Buyer: Fund Order ── */}
            {!isTraveler && order.status === "agreed" && (
              <div className="mt-auto pt-6">
                <StripeCheckoutButton
                  orderId={order.id}
                  totalAmount={itemPrice + reward}
                />
                <p className="mt-2 text-xs text-muted text-center">
                  Secure payment via Stripe. Funds held in escrow until delivery confirmed.
                </p>
              </div>
            )}

            {/* ── Buyer: Confirm Receipt ── */}
            {!isTraveler && (order.status === "handoff_pending" || order.status === "arrived") && (
              <div className="mt-auto pt-6">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/deliveries/${order.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "completed", confirmDelivery: true }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to confirm delivery");
                      }
                      setOrder({ ...order, status: "completed" });
                      setToast({ message: "Delivery confirmed! Payment released to traveler.", type: "success" });
                      setTimeout(() => setToast(null), 3000);
                    } catch (err: any) {
                      setToast({ message: err.message || "Failed to confirm delivery", type: "error" });
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  className="w-full px-6 py-3 bg-success text-white rounded-full font-medium text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Confirm Receipt & Release Payment
                </button>
                <p className="mt-2 text-xs text-muted text-center">
                  Confirm you received your item. Funds will be released to the traveler.
                </p>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex flex-col gap-3 mt-auto pt-6">
              {isTraveler && nextStatus && (
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updatingStatus}
                  className="w-full px-6 py-3 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? "Updating..." : `Mark as ${STATUS_LABELS[nextStatus] || nextStatus}`}
                </button>
              )}

              {isTraveler && !nextStatus && order.status !== "completed" && (
                <div className="w-full px-6 py-3 bg-surface-2 text-muted rounded-full font-medium text-sm text-center">
                  {order.status === "completed" ? "Delivery Completed" : "No further status updates available"}
                </div>
              )}

              {/* Message button */}
              <button
                onClick={() => router.push(`/app/chat?conversation=${order.id}`)}
                className="w-full px-4 py-2.5 text-sm font-medium text-primary border border-border rounded-full hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Message {isTraveler ? "Buyer" : "Traveler"}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-full hover:bg-surface-2 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className={`px-4 py-2.5 rounded-full text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-success text-success" : "bg-error text-error"
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
