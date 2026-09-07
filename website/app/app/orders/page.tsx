"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { COUNTRIES } from "@/lib/data/airports";
import { AIRPORTS } from "@/lib/data/airports";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";
import { fetchOrders, createOrder, updateRequest, deleteRequest } from "@/redux/slices/orders.slice";
import { scrapeRequest } from "@/redux/slices/explore.slice";
import { selectOrdersItems, selectOrdersIsLoading, selectOrdersError } from "@/redux/selectors";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// Get unique cities for a country
function getCitiesForCountry(country: string): string[] {
  const cities = new Set(
    AIRPORTS.filter((a) => a.country === country).map((a) => a.city)
  );
  return Array.from(cities).sort();
}

export default function OrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const rawOrders = useAppSelector(selectOrdersItems);
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const isLoading = useAppSelector(selectOrdersIsLoading);
  const error = useAppSelector(selectOrdersError);
  const [tab, setTab] = useState<"all" | "requests" | "deliveries">("all");

  // Favorites (localStorage only, no state)
  const getFavorites = (): Set<string> => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gf-favorites");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch { return new Set(); }
    }
    return new Set();
  };

  // Edit modal
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "Other",
    imageUrls: [] as string[],
    imageUrlDraft: "", // single-text field where the user pastes a URL and clicks "Add"
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
  const [reScraping, setReScraping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Loved filter
  const [lovedFilter, setLovedFilter] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Fetch orders
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Open edit modal
  const openEdit = useCallback((order: any) => {
    const req = order.request || order;
    setEditingRequest(order);
    setEditForm({
      title: req.title || "",
      description: req.description || "",
      category: req.category || "Other",
      imageUrls: Array.isArray(req.imageUrls) ? req.imageUrls : (req.imageUrls ? [req.imageUrls] : []),
      imageUrlDraft: "",
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
  }, []);

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    setSaving(true);
    setEditError("");
    try {
      await dispatch(updateRequest({
        id: editingRequest.id,
        data: {
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          imageUrls: editForm.imageUrls,
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
        },
      })).unwrap();
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
      await dispatch(deleteRequest(id)).unwrap();
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

  // Handle image upload (base64) — appends to the edit-form imageUrls array.
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditForm((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.includes(dataUrl)
          ? prev.imageUrls
          : [...prev.imageUrls, dataUrl],
      }));
    };
    reader.readAsDataURL(file);
  };

  const filtered = (orders || []).filter((o: any) => {
    if (tab === "requests") return o.role === "buyer";
    if (tab === "deliveries") return o.role === "traveler";
    return true;
  }).filter((o: any) => !lovedFilter || getFavorites().has(o.id));

  // Computed cities for edit form
  const fromCities = editForm.fromCountry ? getCitiesForCountry(editForm.fromCountry) : [];
  const toCities = editForm.toCountry ? getCitiesForCountry(editForm.toCountry) : [];

  /**
   * Re-scrape the product URL to repopulate title/description/category/price
   * and (most importantly) the full array of product images. Existing
   * manually-added image URLs are preserved.
   */
  const handleReScrape = async () => {
    const url = editForm.productUrl.trim();
    if (!url || !url.startsWith("http")) {
      alert("Please enter a valid product URL first.");
      return;
    }
    setReScraping(true);
    try {
      const data = await dispatch(scrapeRequest({ url })).unwrap();
      setEditForm((prev) => ({
        ...prev,
        title: data.title ?? prev.title,
        description: data.description ?? prev.description,
        category: data.category ?? prev.category,
        // Merge: keep any existing images the user uploaded, then prepend the
        // newly scraped images so the user can see them first.
        imageUrls: [
          ...(Array.isArray(data.imageUrls) ? data.imageUrls : []),
          ...prev.imageUrls,
        ],
      }));
    } catch (err) {
      console.error("Re-scrape failed:", err);
      alert("Re-scrape failed. Please try again.");
    } finally {
      setReScraping(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = editForm.imageUrlDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      alert("Image URL must start with http:// or https://");
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.includes(url) ? prev.imageUrls : [...prev.imageUrls, url],
      imageUrlDraft: "",
    }));
  };

  const handleRemoveImage = (url: string) => {
    setEditForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((u) => u !== url),
    }));
  };

  {/* Edit Modal */}
  return (
    <div className="p-0 space-y-0">
      {/* Sticky header: sub-tabs only */}
      <div className="sticky top-0 z-20 bg-surface-1 p-4 border-b border-border">
        {/* Pill tabs */}
        <div className="flex gap-2 flex-wrap">
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
        <button
          onClick={() => setLovedFilter(!lovedFilter)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            lovedFilter
              ? "bg-error text-white"
              : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
          }`}
        >
          ♥ Loved
        </button>
        </div>
      </div>

      {/* Content area with padding */}
      <div className="p-4 space-y-4">
      {/* Order grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-surface-1 rounded-xl overflow-hidden">
              <div className="h-80 bg-surface-3" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((order: any) => {
            const isOwner = order.type === "request" && order.role === "buyer";
            const detailUrl = order.role === "traveler"
              ? `/app/deliveries/${order.id}`
              : `/app/requests/${order.id}`;

            // Unified RequestCard for both buyer requests and traveler deliveries
            const reqData = {
              id: order.id,
              title: order.request?.title || order.title || `Order #${order.id.slice(0, 8)}`,
              category: order.request?.category || order.category || "Other",
              outletName: order.request?.outletName,
              imageUrls: order.request?.imageUrls || order.imageUrls,
              itemPrice: parseFloat(order.itemPrice || order.request?.itemPrice || "0"),
              reward: parseFloat(order.reward || order.request?.reward || "0"),
              fromCity: order.request?.fromCity || order.fromCity,
              fromCountry: order.request?.fromCountry || order.fromCountry,
              toCity: order.request?.toCity || order.toCity,
              toCountry: order.request?.toCountry || order.toCountry,
              status: order.status || order.request?.status || "open",
              deliveryType: order.request?.deliveryType || order.deliveryType,
              deadline: order.request?.deadline || null,
            };

            return (
              <RequestCard
                key={order.id}
                request={reqData}
                href={detailUrl}
                onEdit={isOwner ? (req) => openEdit({ ...order, request: req }) : undefined}
                onDelete={isOwner ? (id) => setDeletingId(id) : undefined}
              />
            );
          })}
        </div>
      )}
      </div>

      {/* Delivery total footer */}
      {tab === "deliveries" && filtered.length > 0 && (
        <div className="mt-0 p-4 bg-surface-1 border-y border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Active Delivery Rewards</p>
              <p className="text-xs text-muted mt-0.5">
                {filtered.filter((o: any) => ["agreed", "funded", "purchased", "in_transit", "arrived", "handoff_pending"].includes(o.status)).length} active deliveries
              </p>
            </div>
            <p className="text-2xl font-bold text-success">
              +{formatCurrency(
                filtered
                  .filter((o: any) => ["agreed", "funded", "purchased", "in_transit", "arrived", "handoff_pending"].includes(o.status))
                  .reduce((sum: number, o: any) => sum + parseFloat(o.reward || "0"), 0)
              )}
            </p>
          </div>
        </div>
      )}


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
        <div >
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
          {/* Product Images — multi-image gallery with upload + URL paste + remove */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Product Images</label>
              <span className="text-xs text-muted">{editForm.imageUrls.length} attached</span>
            </div>

            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-secondary hover:bg-surface-hover transition-colors"
              >
                📷 Upload Image
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
                value={editForm.imageUrlDraft}
                onChange={(e) => setEditForm((p) => ({ ...p, imageUrlDraft: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImageUrl(); } }}
                placeholder="Or paste image URL and press Enter"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!editForm.imageUrlDraft.trim()}
                className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>

            {editForm.imageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {editForm.imageUrls.map((url, idx) => (
                  <div key={url + idx} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-border bg-surface-2"
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, imageUrls: p.imageUrls.filter((u) => u !== url) }))}
                      aria-label={`Remove image ${idx + 1}`}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-error text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 bg-primary text-white rounded">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Re-generate from product URL — re-runs the scrape to repopulate title/images/price */}
          <div>
            <label className="block text-sm font-medium mb-1">Re-generate from URL</label>
            <button
              type="button"
              onClick={handleReScrape}
              disabled={!editForm.productUrl.trim() || reScraping}
              className="w-full px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {reScraping ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Re-scraping…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 11-9-9c2.39 0 4.68.94 6.36 2.64L21 8"/>
                    <path d="M21 3v5h-5"/>
                  </svg>
                  Re-generate from URL
                </>
              )}
            </button>
            <p className="text-xs text-muted mt-1">Fetches the latest title, description, price, and images from the product URL. Existing images are preserved.</p>
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
