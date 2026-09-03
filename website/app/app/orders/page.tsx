"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { COUNTRIES } from "@/lib/data/airports";
import { AIRPORTS } from "@/lib/data/airports";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";

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

function getStatusClasses(color: string): string {
  const map: Record<string, string> = {
    green: "bg-success text-success",
    red: "bg-error text-error",
    orange: "bg-warning text-warning",
    blue: "bg-info text-info",
    gray: "bg-surface-2 text-muted",
  };
  return map[color] || map.gray;
}

// Get unique cities for a country
function getCitiesForCountry(country: string): string[] {
  const cities = new Set(
    AIRPORTS.filter((a) => a.country === country).map((a) => a.city)
  );
  return Array.from(cities).sort();
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "requests" | "deliveries">("all");

  // Favorites (localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gf-favorites");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch { return new Set(); }
    }
    return new Set();
  });

  // Dropdown menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Edit modal
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "Other",
    imageUrl: "",
    productUrl: "",
    deliveryType: "standard" as "standard" | "click_and_collect",
    itemPrice: "",
    reward: "",
    pickupLocation: "",
    pickupInstructions: "",
    fromCountry: "",
    fromCity: "",
    toCountry: "",
    toCity: "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch orders
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("gf-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  // Share request link
  const shareRequest = useCallback((id: string) => {
    const url = `${window.location.origin}/app/requests/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast({ message: "Link copied to clipboard!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    }).catch(() => {
      setToast({ message: "Failed to copy link", type: "error" });
      setTimeout(() => setToast(null), 3000);
    });
    setActiveMenu(null);
  }, []);

  // Open edit modal
  const openEdit = useCallback((order: any) => {
    const req = order.request || order;
    setEditingRequest(order);
    setEditForm({
      title: req.title || "",
      description: req.description || "",
      category: req.category || "Other",
      imageUrl: req.imageUrl || "",
      productUrl: req.productUrl || "",
      deliveryType: req.deliveryType || "standard",
      itemPrice: String(req.itemPrice || order.itemPrice || ""),
      reward: String(req.reward || order.reward || ""),
      pickupLocation: req.pickupLocation || "",
      pickupInstructions: req.pickupInstructions || "",
      fromCountry: req.fromCountry || "",
      fromCity: req.fromCity || "",
      toCountry: req.toCountry || "",
      toCity: req.toCity || "",
    });
    setEditError("");
    setActiveMenu(null);
  }, []);

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    setSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/requests/${editingRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          imageUrl: editForm.imageUrl,
          productUrl: editForm.productUrl,
          deliveryType: editForm.deliveryType,
          itemPrice: parseFloat(editForm.itemPrice) || 0,
          reward: parseFloat(editForm.reward) || 0,
          pickupLocation: editForm.pickupLocation,
          pickupInstructions: editForm.pickupInstructions,
          fromCountry: editForm.fromCountry,
          fromCity: editForm.fromCity,
          toCountry: editForm.toCountry,
          toCity: editForm.toCity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === editingRequest.id) {
            return {
              ...o,
              request: {
                ...o.request,
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                imageUrl: editForm.imageUrl,
                deliveryType: editForm.deliveryType,
                fromCountry: editForm.fromCountry,
                fromCity: editForm.fromCity,
                toCountry: editForm.toCountry,
                toCity: editForm.toCity,
              },
              itemPrice: editForm.itemPrice,
              reward: editForm.reward,
            };
          }
          return o;
        })
      );
      setEditingRequest(null);
      setToast({ message: "Request updated successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Delete request
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setDeletingId(null);
      setToast({ message: "Request deleted", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Failed to delete request", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  // Handle image upload (base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const filtered = orders.filter((o: any) => {
    if (tab === "requests") return o.role === "buyer";
    if (tab === "deliveries") return o.role === "traveler";
    return true;
  });

  // Computed cities for edit form
  const fromCities = editForm.fromCountry ? getCitiesForCountry(editForm.fromCountry) : [];
  const toCities = editForm.toCountry ? getCitiesForCountry(editForm.toCountry) : [];

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
                ? "bg-primary text-white"
                : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Order grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-surface-1 rounded-xl overflow-hidden">
              <div className="h-44 bg-surface-3" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-surface-3 rounded w-2/3" />
                <div className="h-3 bg-surface-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </div>
          <p className="font-semibold text-primary mb-1">No orders or requests yet</p>
          <p className="text-sm text-muted">Post a request as a buyer, or accept one as a traveller, to start an escrow-protected order.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((order: any) => {
            const isOwner = order.type === "request" && order.role === "buyer";
            const requestUrl = `/app/requests/${order.id}`;

            // For request-type items (buyer's own requests), use RequestCard directly
            if (isOwner && order.type === "request") {
              // Merge order-level fields into a request-shaped object for RequestCard
              const reqData = {
                id: order.id,
                title: order.request?.title || order.title || `Order #${order.id.slice(0, 8)}`,
                category: order.request?.category || order.category || "Other",
                imageUrl: order.request?.imageUrl || order.imageUrl,
                itemPrice: parseFloat(order.itemPrice || order.request?.itemPrice || "0"),
                reward: parseFloat(order.reward || order.request?.reward || "0"),
                fromCity: order.request?.fromCity || order.fromCity,
                fromCountry: order.request?.fromCountry || order.fromCountry,
                toCity: order.request?.toCity || order.toCity,
                toCountry: order.request?.toCountry || order.toCountry,
                status: order.status || order.request?.status || "open",
                deliveryType: order.request?.deliveryType || order.deliveryType,
              };

              const statusInfo = getStatusColor(order.status);
              const isFavorited = favorites.has(order.id);

              return (
                <div key={order.id} className="relative group">
                  <RequestCard request={reqData} />

                  {/* Overlay actions on hover */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {/* Heart / Favorite */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(order.id); }}
                      className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${
                        isFavorited
                          ? "bg-error text-white"
                          : "bg-black/50 text-white hover:bg-error"
                      }`}
                      aria-label="Favorite"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </button>
                    {/* Share */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareRequest(order.id); }}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-primary backdrop-blur-sm transition-colors"
                      aria-label="Share"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                      </svg>
                    </button>
                    {/* More menu */}
                    <div className="relative" ref={activeMenu === order.id ? menuRef : undefined}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(activeMenu === order.id ? null : order.id); }}
                        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-surface-hover-strong backdrop-blur-sm transition-colors"
                        aria-label="More options"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                        </svg>
                      </button>
                      {activeMenu === order.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-1 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(requestUrl); setActiveMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Details
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(order); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                            </svg>
                            Edit Request
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(order.id); setActiveMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error transition-colors text-left"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Delete Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status chip overlay */}
                  {order.status !== "open" && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClasses(getStatusColor(order.status).color)}`}>
                        {getStatusColor(order.status).label}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            // For order-type items (traveler's deliveries), create matching card
            const img = order.imageUrl || order.request?.imageUrl;
            const statusInfo = getStatusColor(order.status);
            const title = order.request?.title || `Order #${order.id.slice(0, 8)}`;
            const fromCity = order.request?.fromCity || order.fromCity;
            const fromCountry = order.request?.fromCountry || order.fromCountry;
            const toCity = order.request?.toCity || order.toCity;
            const toCountry = order.request?.toCountry || order.toCountry;
            const category = order.request?.category || "Other";
            const deliveryType = order.request?.deliveryType || order.deliveryType;
            const price = parseFloat(order.itemPrice || "0");
            const reward = parseFloat(order.reward || "0");
            const isFavorited = favorites.has(order.id);
            const pickupLocation = order.request?.pickupLocation;

            return (
              <div key={order.id} className="relative group">
                <Link href={requestUrl}>
                  <div className="bg-surface-1 rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-44 -mx-0 -mt-0 mb-0 overflow-hidden">
                      <img
                        src={img || `https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop`}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Category badge */}
                      <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white shadow-sm">
                        {category}
                      </span>
                      {/* Delivery type badge */}
                      {deliveryType === "click_and_collect" && (
                        <span className="absolute top-3 left-3 mt-8 text-xs font-medium px-1.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white shadow-sm" title="Click & Collect">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                          </svg>
                        </span>
                      )}
                      {/* Reward badge */}
                      <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 bg-primary text-white rounded-full shadow-sm">
                        +{formatCurrency(reward)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col h-full p-3">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>

                      {/* Route */}
                      <div className="space-y-1 text-sm text-white">
                        <p className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {fromCity && fromCountry
                            ? `${fromCity}, ${fromCountry}`
                            : "Origin TBD"}
                          {" → "}
                          {toCity && toCountry
                            ? `${toCity}, ${toCountry}`
                            : "Destination TBD"}
                        </p>
                      </div>

                      {/* Price section - reward primary */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted">Delivery Reward</p>
                            <p className="font-bold text-lg text-primary-color">+{formatCurrency(reward)}</p>
                          </div>
                          {price > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-muted">Item Price</p>
                              <p className="text-sm text-muted">{formatCurrency(price)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Heart */}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(order.id); }}
                            className={`p-1 transition-colors ${isFavorited ? "text-error" : "text-muted hover:text-error"}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                          </button>
                          {/* Share */}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareRequest(order.id); }}
                            className="p-1 text-muted hover:text-primary-color transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                            </svg>
                          </button>
                        </div>
                        {/* Status chip */}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClasses(statusInfo.color)}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Overlay actions on hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="relative" ref={activeMenu === order.id ? menuRef : undefined}>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenu(activeMenu === order.id ? null : order.id); }}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-surface-hover-strong backdrop-blur-sm transition-colors"
                      aria-label="More options"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                    {activeMenu === order.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface-1 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(requestUrl); setActiveMenu(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        title="Edit Request"
        footer={
          <>
            <button onClick={() => setEditingRequest(null)} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
              Cancel
            </button>
            <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Product URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Product URL</label>
            <input
              type="text"
              value={editForm.productUrl}
              onChange={(e) => setEditForm((p) => ({ ...p, productUrl: e.target.value }))}
              placeholder="https://store.example.com/product..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-secondary hover:bg-surface-hover transition-colors"
              >
                📷 Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                type="text"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="Or paste image URL"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {editForm.imageUrl && (
              <div className="mt-2 relative inline-block">
                <img src={editForm.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => setEditForm((p) => ({ ...p, imageUrl: "" }))}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Nike Air Max from London"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Optional details..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Beauty">Beauty</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Food">Food</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Delivery Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Delivery Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditForm((p) => ({ ...p, deliveryType: "standard" }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  editForm.deliveryType === "standard"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
                }`}
              >
                📦 Standard Delivery
              </button>
              <button
                type="button"
                onClick={() => setEditForm((p) => ({ ...p, deliveryType: "click_and_collect" }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  editForm.deliveryType === "click_and_collect"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
                }`}
              >
                ✈️ Click & Collect
              </button>
            </div>
          </div>

          {/* Price fields */}
          {editForm.deliveryType === "standard" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Item Price (USDC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={editForm.itemPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    if (val.split(".").length > 2) return;
                    setEditForm((p) => ({ ...p, itemPrice: val }));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Reward (USDC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={editForm.reward}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    if (val.split(".").length > 2) return;
                    setEditForm((p) => ({ ...p, reward: val }));
                  }}
                  placeholder="10% of price"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Location</label>
                <input
                  type="text"
                  value={editForm.pickupLocation}
                  onChange={(e) => setEditForm((p) => ({ ...p, pickupLocation: e.target.value }))}
                  placeholder="e.g., Heinemann Departures Shop, Sydney Airport"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Instructions</label>
                <textarea
                  value={editForm.pickupInstructions}
                  onChange={(e) => setEditForm((p) => ({ ...p, pickupInstructions: e.target.value }))}
                  rows={2}
                  placeholder="Order #12345, have confirmation email ready"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pickup Fee (USDC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={editForm.reward}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    if (val.split(".").length > 2) return;
                    setEditForm((p) => ({ ...p, reward: val }));
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}

          {/* Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Country</label>
              <select
                value={editForm.fromCountry}
                onChange={(e) => setEditForm((p) => ({ ...p, fromCountry: e.target.value, fromCity: "" }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From City</label>
              <select
                value={editForm.fromCity}
                onChange={(e) => setEditForm((p) => ({ ...p, fromCity: e.target.value }))}
                disabled={!editForm.fromCountry}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-2 disabled:text-muted"
              >
                <option value="">{editForm.fromCountry ? "Select city" : "Select country first"}</option>
                {fromCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">To Country</label>
              <select
                value={editForm.toCountry}
                onChange={(e) => setEditForm((p) => ({ ...p, toCountry: e.target.value, toCity: "" }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To City</label>
              <select
                value={editForm.toCity}
                onChange={(e) => setEditForm((p) => ({ ...p, toCity: e.target.value }))}
                disabled={!editForm.toCountry}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-2 disabled:text-muted"
              >
                <option value="">{editForm.toCountry ? "Select city" : "Select country first"}</option>
                {toCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {editError && <p className="text-sm text-error">{editError}</p>}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Request"
        footer={
          <>
            <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
              Cancel
            </button>
            <button
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-error text-white rounded-lg font-medium hover:bg-error disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-secondary">
          Are you sure you want to delete this request? This action cannot be undone.
        </p>
      </Modal>

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
    </div>
  );
}
