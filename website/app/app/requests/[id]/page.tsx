"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";
import { ChevronDown, ArrowLeft, MapPin, Calendar, Tag, Info } from "lucide-react";

const CATEGORY_IMAGES: Record<string, string> = {
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=500&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=500&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=500&fit=crop",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop",
  Travel: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&h=500&fit=crop",
  Other: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=500&fit=crop",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwner = authUser?.id === request?.buyerId;

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Travel plan matching state
  const [matchingPlans, setMatchingPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${params.id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Request not found");
        const data = await res.json();
        if (!ignore) setRequest(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load request");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchRequest();
    return () => { ignore = true; controller.abort(); };
  }, [params.id]);

  // Fetch traveler's plans to check for matches
  useEffect(() => {
    if (!request || isOwner) return;

    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/travel-plans/mine");
        if (!res.ok) return;
        const plans = await res.json();

        // Filter plans that match the request's destination and timing
        const matches = plans.filter((plan: any) => {
          if (plan.status !== "active") return false;

          // Check destination match (city match, or country match if city is TBD)
          const destMatch =
            (plan.toCity === request.toCity) ||
            (plan.toCountry === request.toCountry && (!request.toCity || request.toCity === "TBD"));

          if (!destMatch) return false;

          // Check date range if deadline is set
          if (request.deadline) {
            const deadline = new Date(request.deadline);
            const depart = new Date(plan.departDate);
            const returnDate = plan.returnDate ? new Date(plan.returnDate) : null;

            // Deadline must be after departure and before/on return (or no return date set)
            if (deadline < depart) return false;
            if (returnDate && deadline > returnDate) return false;
          }

          return true;
        });

        setMatchingPlans(matches);
      } catch (err) {
        console.error("Failed to fetch travel plans:", err);
      }
    };

    fetchPlans();
  }, [request, isOwner]);

  const startEdit = () => {
    setEditForm({
      title: request.title || "",
      description: request.description || "",
      category: request.category || "Other",
      deliveryType: request.deliveryType || "standard",
      pickupLocation: request.pickupLocation || "",
      pickupInstructions: request.pickupInstructions || "",
      itemPrice: request.itemPrice || "",
      reward: request.reward || "",
      fromCountry: request.fromCountry || "",
      fromCity: request.fromCity || "",
      toCountry: request.toCountry || "",
      toCity: request.toCity || "",
      deadline: request.deadline ? new Date(request.deadline).toISOString().split("T")[0] : "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setRequest(updated);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${params.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/app/explore");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAcceptDelivery = async (planId?: string) => {
    setAccepting(true);
    setAcceptError(null);

    try {
      const res = await fetch(`/api/requests/${params.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travelPlanId: planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept delivery");
      }

      // Success — navigate to the order
      router.push(`/app/deliveries/${data.id}`);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Failed to accept delivery");
    } finally {
      setAccepting(false);
      setShowPlanModal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-surface-2 rounded-2xl"></div>
          <div className="h-8 bg-surface-2 rounded w-1/2"></div>
          <div className="h-4 bg-surface-2 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <p className="text-muted mb-4">{error || "Request not found"}</p>
        <Button variant="primary" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const image = request.imageUrl || CATEGORY_IMAGES[request.category || "Other"] || CATEGORY_IMAGES.Other;

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

        {/* ── EDIT MODE ── */}
        {editing ? (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Beauty">Beauty</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Item Price (USDC)</label>
                  <input type="number" value={editForm.itemPrice} onChange={(e) => setEditForm({ ...editForm, itemPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Type</label>
                <select value={editForm.deliveryType} onChange={(e) => setEditForm({ ...editForm, deliveryType: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="standard">Standard Delivery</option>
                  <option value="click_and_collect">Click & Collect</option>
                </select>
              </div>
              {editForm.deliveryType === "click_and_collect" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pickup Location</label>
                    <input type="text" value={editForm.pickupLocation} onChange={(e) => setEditForm({ ...editForm, pickupLocation: e.target.value })}
                      placeholder="e.g. Central Station Locker B12"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pickup Instructions</label>
                    <textarea value={editForm.pickupInstructions} onChange={(e) => setEditForm({ ...editForm, pickupInstructions: e.target.value })} rows={2}
                      placeholder="e.g. Ask for the package at the front desk"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Reward (USDC)</label>
                <input type="number" value={editForm.reward} onChange={(e) => setEditForm({ ...editForm, reward: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">From Country</label>
                  <input type="text" value={editForm.fromCountry} onChange={(e) => setEditForm({ ...editForm, fromCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From City</label>
                  <input type="text" value={editForm.fromCity} onChange={(e) => setEditForm({ ...editForm, fromCity: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">To Country</label>
                  <input type="text" value={editForm.toCountry} onChange={(e) => setEditForm({ ...editForm, toCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To City</label>
                  <input type="text" value={editForm.toCity} onChange={(e) => setEditForm({ ...editForm, toCity: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </Card>
        ) : (
          /* ── PRODUCT VIEW ── */
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* ─── LEFT: Image ─── */}
            <div className="md:w-[45%] shrink-0">
              <div className="relative aspect-[3/4] min-h-[400px] md:min-h-[400px] rounded-2xl overflow-hidden bg-surface-2">
                <img
                  src={image}
                  alt={request.title}
                  className="w-full h-full object-cover"
                />

                {/* Category badge — top left */}
                <span className="absolute top-4 left-4 text-xs font-medium px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white shadow-sm">
                  {request.category || "Other"}
                </span>

                {/* Price badge — top right */}
                <span className="absolute top-4 right-4 text-sm font-bold px-3.5 py-1.5 bg-primary text-white rounded-full shadow-sm">
                  +{formatCurrency(request.reward)}
                </span>
              </div>
            </div>

            {/* ─── RIGHT: Details ─── */}
            <div className="md:w-[55%] flex flex-col justify-center">
              {/* Click & Collect badge */}
              {request.deliveryType === "click_and_collect" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-3 text-primary rounded-full text-sm font-medium mb-3 w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                  </svg>
                  Click & Collect
                </span>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3 leading-tight">
                {request.title}
              </h1>

              {/* Description */}
              {request.description && (
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
                    {request.fromCity}, {request.fromCountry}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted" />
                    To
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {request.toCity}, {request.toCountry}
                  </span>
                </div>
                {request.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted" />
                      Deadline
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {new Date(request.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted" />
                    Status
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    request.status === "open" ? "bg-success text-success" :
                    request.status === "completed" ? "bg-success text-success" :
                    request.status === "cancelled" ? "bg-error text-error" :
                    request.status === "in_transit" ? "bg-info text-info" :
                    "bg-surface-2 text-muted"
                  }`}>
                    {request.status === "open" ? "Open" : request.status?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-6" />

              {/* Price section */}
              <div className="mb-6">
                {request.deliveryType === "click_and_collect" ? (
                  <>
                    <p className="text-sm text-muted mb-1">Pickup Fee</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(parseFloat(request.reward?.toString() || "0"))}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted">Item Price</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(parseFloat(request.itemPrice?.toString() || "0"))}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted">Delivery Reward</p>
                      <p className="text-xl font-bold text-success">
                        +{formatCurrency(parseFloat(request.reward?.toString() || "0"))}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Pickup location (click & collect only) */}
              {request.deliveryType === "click_and_collect" && request.pickupLocation && (
                <div className="mb-4">
                  <label className="block text-sm text-muted mb-2">Pick-up at the airport</label>
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border border-border rounded-xl">
                    <span className="text-sm font-medium text-primary">{request.pickupLocation}</span>
                    <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                  </div>
                </div>
              )}

              {/* Pickup instructions (click & collect only) */}
              {request.deliveryType === "click_and_collect" && request.pickupInstructions && (
                <div className="flex items-start gap-2 mb-6">
                  <Info className="h-4 w-4 text-muted mt-0.5 shrink-0" />
                  <p className="text-sm text-muted leading-relaxed">{request.pickupInstructions}</p>
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div className="flex flex-col gap-3 mt-auto pt-6">
                {isOwner ? (
                  <>
                    <button
                      onClick={startEdit}
                      className="w-full px-6 py-3 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors"
                    >
                      Edit Request
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-error border-2 border-error rounded-full hover:text-on-primary transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-full hover:bg-surface-2 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </>
                  ) : request.status === "open" ? (
                  <>
                    <button
                      onClick={() => {
                        if (matchingPlans.length === 0) {
                          setAcceptError("You don't have a matching travel plan for this delivery. Create a travel plan that covers this route and deadline first.");
                          return;
                        }
                        if (matchingPlans.length === 1) {
                          handleAcceptDelivery(matchingPlans[0].id);
                        } else {
                          setShowPlanModal(true);
                        }
                      }}
                      disabled={accepting}
                      className="w-full px-6 py-3 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {accepting ? "Accepting..." : "Accept Delivery"}
                    </button>

                    {/* Matching plan indicator */}
                    {matchingPlans.length > 0 && (
                      <p className="text-xs text-center text-success">
                        ✓ {matchingPlans.length} matching travel plan{matchingPlans.length !== 1 ? "s" : ""} found
                      </p>
                    )}

                    {/* Error message */}
                    {acceptError && (
                      <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-xl">
                        <p className="text-sm text-error">{acceptError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => router.back()}
                      className="w-full px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-full hover:bg-surface-2 transition-colors"
                    >
                      Back
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.back()}
                    className="w-full px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-full hover:bg-surface-2 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Request">
        <div className="space-y-4">
          <p className="text-sm text-secondary">Are you sure you want to delete &quot;{request.title}&quot;? This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 text-sm font-medium rounded-full border-2 border-error text-error transition-colors delete-btn">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Travel Plan Selection Modal */}
      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Select Travel Plan">
        <div className="space-y-3">
          <p className="text-sm text-secondary">
            Choose which travel plan to associate with this delivery:
          </p>
          {matchingPlans.map((plan: any) => (
            <button
              key={plan.id}
              onClick={() => handleAcceptDelivery(plan.id)}
              disabled={accepting}
              className="w-full p-3 text-left border border-border rounded-xl hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary">
                    {plan.fromCity}, {plan.fromCountry} → {plan.toCity}, {plan.toCountry}
                  </p>
                  <p className="text-sm text-muted">
                    {new Date(plan.departDate).toLocaleDateString()}
                    {plan.returnDate ? ` — ${new Date(plan.returnDate).toLocaleDateString()}` : " — No return date"}
                  </p>
                </div>
                <span className="text-xs text-muted">Capacity: {plan.capacity}</span>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
