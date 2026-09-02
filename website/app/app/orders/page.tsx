"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_IMAGES: Record<string, string> = {
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=100&h=100&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop",
  Other: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function getStatusColor(status: string): { label: string; color: string } {
  switch (status) {
    case "completed": return { label: "✓ Completed", color: "green" };
    case "in_transit":
    case "traveling": return { label: "✈ Traveling", color: "green" };
    case "purchased": return { label: "✈ Purchased", color: "green" };
    case "cancelled": return { label: "Cancelled", color: "red" };
    case "offer_sent": return { label: "Offer sent", color: "orange" };
    case "pending": return { label: "Pending", color: "orange" };
    case "open": return { label: "Open", color: "blue" };
    default: return { label: status?.replace(/_/g, " ") || "Unknown", color: "gray" };
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "requests" | "deliveries">("all");

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders", { signal: controller.signal });
        if (!res.ok) { if (!ignore) setOrders([]); return; }
        const data = await res.json();
        if (!ignore) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setOrders([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchOrders();
    return () => { ignore = true; controller.abort(); };
  }, []);

  const filtered = orders.filter((o: any) => {
    if (tab === "requests") return o.role === "buyer";
    if (tab === "deliveries") return o.role === "traveler";
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {/* Pill tabs */}
      <div className="flex gap-2">
        {(["all", "requests", "deliveries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 p-3 bg-white rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </div>
          <p className="font-semibold text-gray-800 mb-1">No orders or requests yet</p>
          <p className="text-sm text-gray-500">Post a request as a buyer, or accept one as a traveller, to start an escrow-protected order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const img = order.imageUrl || order.request?.imageUrl || CATEGORY_IMAGES[order.request?.category || "Other"] || CATEGORY_IMAGES.Other;
            const status1 = getStatusColor(order.status);
            const title = order.request?.title || `Order #${order.id.slice(0, 8)}`;
            const partnerName = order.travelerName || order.buyerName || "Unknown";
            const partnerInitials = partnerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const price = parseFloat(order.itemPrice || "0");
            const reward = parseFloat(order.reward || "0");
            // Second status badge (e.g., Cancelled, Offer sent)
            let status2: { label: string; color: string } | null = null;
            if (order.status === "cancelled") status2 = { label: "Cancelled", color: "red" };
            else if (order.status === "offer_sent") status2 = { label: "Offer sent", color: "orange" };
            // For open requests, show "Waiting for Traveler" badge
            const isWaiting = order.type === "request" && order.status === "open";

            return (
              <div key={order.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                {/* Thumbnail */}
                <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Status badges */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <StatusBadge {...status1} />
                    {status2 && <StatusBadge {...status2} />}
                    {isWaiting && <StatusBadge label="⏳ Waiting for Traveler" color="orange" />}
                  </div>
                  {/* Title */}
                  <h3 className="font-semibold text-sm truncate">{title}</h3>
                  {/* Click & Collect badge */}
                  {order.type === "request" && order.request?.deliveryType === "click_and_collect" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      ✈️ Click & Collect
                    </span>
                  )}
                  {/* Partner + Price */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-600 shrink-0">
                        {partnerInitials}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{partnerName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold">{formatCurrency(price)}</div>
                      {reward > 0 && <div className="text-xs text-green-600">+{formatCurrency(reward)}</div>}
                    </div>
                  </div>
                  {/* Pickup location for Click & Collect */}
                  {order.request?.deliveryType === "click_and_collect" && order.request?.pickupLocation && (
                    <p className="text-xs text-blue-600 mt-1 truncate">
                      📍 {order.request.pickupLocation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
