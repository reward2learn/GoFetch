"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchTrips = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/travel-plans/mine", { signal: controller.signal });
        if (!res.ok) { if (!ignore) setTrips([]); return; }
        const data = await res.json();
        if (!ignore) setTrips(Array.isArray(data) ? data : data.travelPlans || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setTrips([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchTrips();
    return () => { ignore = true; controller.abort(); };
  }, [refreshKey]);

  const handleCreateTrip = async (formData: FormData) => {
    try {
      const res = await fetch("/api/travel-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCountry: formData.get("fromCountry"),
          fromCity: formData.get("fromCity"),
          toCountry: formData.get("toCountry"),
          toCity: formData.get("toCity"),
          departDate: formData.get("departDate"),
          returnDate: formData.get("returnDate"),
          capacity: parseInt(formData.get("capacity") as string) || 5,
          notes: formData.get("notes"),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to create trip:", err);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm("Cancel this trip?")) return;
    try {
      await fetch(`/api/travel-plans/${tripId}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to cancel trip:", err);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">My Trips</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-4 bg-surface-1 rounded-xl border border-border">
              <div className="h-4 bg-surface-2 rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted mb-4">No trips yet</p>
          <button onClick={() => setShowCreateModal(true)} className="text-primary-color font-medium">
            Post Your First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip: any) => (
            <div key={trip.id} className="p-4 bg-surface-1 rounded-xl border border-border">
              {/* Route */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-0.5">From</p>
                  <p className="font-semibold text-sm truncate">
                    {trip.fromCity} ({trip.fromCountry})
                  </p>
                </div>
                <div className="text-orange-400 mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted mb-0.5">To</p>
                  <p className="font-semibold text-sm truncate">
                    {trip.toCity}, {trip.toCountry}
                  </p>
                </div>
              </div>

              {/* Date */}
              {trip.departDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                  Departs {new Date(trip.departDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span>0 matching requests</span>
                </div>
                <button
                  onClick={() => handleCancelTrip(trip.id)}
                  className="text-sm font-medium text-error hover:text-error"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Trip button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-primary text-white px-5 py-3 rounded-full font-medium shadow-lg hover:bg-primary-hover transition-colors flex items-center gap-2 z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
        </svg>
        Add trip
      </button>

      {/* Create Trip Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Post Travel Plan">
        <form action={handleCreateTrip} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="From Country" name="fromCountry" placeholder="Indonesia" />
            <Input label="From City" name="fromCity" placeholder="Bali" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="To Country" name="toCountry" placeholder="Japan" />
            <Input label="To City" name="toCity" placeholder="Tokyo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Depart Date" name="departDate" type="date" />
            <Input label="Return Date" name="returnDate" type="date" />
          </div>
          <Input label="Capacity" name="capacity" type="number" placeholder="5" />
          <Input label="Notes" name="notes" placeholder="Optional notes" />
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-hover">
              Post Trip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
