"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { COUNTRIES, getCitiesForCountry } from "@/lib/data/airports";
import { getCountryImage } from "@/lib/data/destinations";

interface TripData {
  id: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  departDate: string;
  returnDate?: string;
  capacity: number;
  note?: string;
  status: string;
  createdAt: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [matchingRequests, setMatchingRequests] = useState<Record<string, any[]>>({});
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  // Form state
  const [formFromCountry, setFormFromCountry] = useState("");
  const [formFromCity, setFormFromCity] = useState("");
  const [formToCountry, setFormToCountry] = useState("");
  const [formToCity, setFormToCity] = useState("");
  const [formDepartDate, setFormDepartDate] = useState("");
  const [formReturnDate, setFormReturnDate] = useState("");
  const [formCapacity, setFormCapacity] = useState("5");
  const [formNotes, setFormNotes] = useState("");
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formPassport, setFormPassport] = useState<string | null>(null);
  const [formItinerary, setFormItinerary] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const itineraryInputRef = useRef<HTMLInputElement>(null);

  const fromCities = formFromCountry ? getCitiesForCountry(formFromCountry) : [];
  const toCities = formToCountry ? getCitiesForCountry(formToCountry) : [];

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

  // Fetch matching requests for each trip
  useEffect(() => {
    if (trips.length === 0) return;

    const fetchMatches = async () => {
      const matches: Record<string, any[]> = {};
      for (const trip of trips) {
        try {
          const params = new URLSearchParams();
          params.append("fromCountry", trip.fromCountry);
          params.append("toCountry", trip.toCountry);
          const res = await fetch(`/api/requests/match?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            matches[trip.id] = data;
          }
        } catch (err) {
          console.error("Failed to fetch matches:", err);
        }
      }
      setMatchingRequests(matches);
    };

    fetchMatches();
  }, [trips]);

  const resetForm = () => {
    setFormFromCountry("");
    setFormFromCity("");
    setFormToCountry("");
    setFormToCity("");
    setFormDepartDate("");
    setFormReturnDate("");
    setFormCapacity("5");
    setFormNotes("");
    setFormPhoto(null);
    setFormPassport(null);
    setFormItinerary(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (trip: TripData) => {
    setFormFromCountry(trip.fromCountry);
    setFormFromCity(trip.fromCity);
    setFormToCountry(trip.toCountry);
    setFormToCity(trip.toCity);
    setFormDepartDate(trip.departDate ? new Date(trip.departDate).toISOString().split("T")[0] : "");
    setFormReturnDate(trip.returnDate ? new Date(trip.returnDate).toISOString().split("T")[0] : "");
    setFormCapacity(trip.capacity?.toString() || "5");
    
    // Parse note field for photo data
    try {
      const noteData = JSON.parse(trip.note || "{}");
      setFormNotes(noteData.text || "");
      setFormPhoto(noteData.photo || null);
      setFormPassport(noteData.passport || null);
      setFormItinerary(noteData.itinerary || null);
    } catch {
      setFormNotes(trip.note || "");
    }
    
    setEditingTrip(trip);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build note as JSON with photo data
      const noteData = {
        text: formNotes,
        photo: formPhoto,
        passport: formPassport,
        itinerary: formItinerary,
      };
      const noteJson = JSON.stringify(noteData);

      const payload = {
        fromCountry: formFromCountry,
        fromCity: formFromCity,
        toCountry: formToCountry,
        toCity: formToCity,
        departDate: formDepartDate || undefined,
        returnDate: formReturnDate || undefined,
        capacity: parseInt(formCapacity) || 5,
        note: noteJson,
      };

      let res;
      if (editingTrip) {
        res = await fetch(`/api/travel-plans/${editingTrip.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/travel-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowCreateModal(false);
        setEditingTrip(null);
        resetForm();
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to save trip:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Delete this trip?")) return;
    try {
      await fetch(`/api/travel-plans/${tripId}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  const parseNote = (note?: string) => {
    try {
      return JSON.parse(note || "{}");
    } catch {
      return { text: note };
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
          <button onClick={openCreateModal} className="text-primary font-medium">
            Post Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip: any) => {
            const noteData = parseNote(trip.note);
            const matches = matchingRequests[trip.id] || [];
            const isExpanded = expandedTrip === trip.id;

            return (
              <div key={trip.id} className="bg-surface-1 rounded-xl border border-border overflow-hidden flex flex-col">
                {/* Destination image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={getCountryImage(trip.toCountry)}
                    alt={trip.toCountry}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white font-semibold text-sm drop-shadow-lg">
                      {trip.toCity}, {trip.toCountry}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-1">
                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted mb-0.5">From</p>
                      <p className="font-semibold text-sm truncate">
                        {trip.fromCity} ({trip.fromCountry})
                      </p>
                    </div>
                    <div className="text-orange-400 mt-3 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-xs text-muted mb-0.5">To</p>
                      <p className="font-semibold text-sm truncate">
                        {trip.toCity}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  {trip.departDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                      Departs {new Date(trip.departDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {trip.returnDate && (
                        <> — {new Date(trip.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {noteData.text && (
                    <p className="text-xs text-secondary mb-2 line-clamp-2">{noteData.text}</p>
                  )}

                  {/* Indicators */}
                  <div className="flex items-center gap-2 mb-2">
                    {noteData.passport && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Passport
                      </span>
                    )}
                    {noteData.itinerary && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Itinerary
                      </span>
                    )}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      {matches.length} match{matches.length !== 1 ? "es" : ""}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(trip)}
                        className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="text-xs font-medium text-error hover:text-error transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Matching requests expandable section */}
                  {isExpanded && matches.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                      {matches.slice(0, 3).map((req: any) => (
                        <div key={req.id} className="p-2 bg-surface-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{req.title}</p>
                              <p className="text-xs text-muted">{req.fromCity} → {req.toCity}</p>
                            </div>
                            <span className="text-xs font-bold text-success shrink-0">+{req.reward}</span>
                          </div>
                        </div>
                      ))}
                      {matches.length > 3 && (
                        <p className="text-xs text-muted text-center">+{matches.length - 3} more</p>
                      )}
                      {/* View all matched items button */}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("fromCountry", trip.fromCountry);
                          params.set("toCountry", trip.toCountry);
                          router.push(`/app/explore?${params.toString()}`);
                        }}
                        className="w-full mt-3 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.3-4.3"/>
                        </svg>
                        View All Matched Items
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Trip button */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-primary text-white px-5 py-3 rounded-full font-medium shadow-lg hover:bg-primary-hover transition-colors flex items-center gap-2 z-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
        </svg>
        Add trip
      </button>

      {/* Create/Edit Trip Modal */}
      <Modal 
        isOpen={showCreateModal || !!editingTrip} 
        onClose={() => { setShowCreateModal(false); setEditingTrip(null); resetForm(); }} 
        title={editingTrip ? "Edit Travel Plan" : "Post Travel Plan"}
        footer={
          <>
            <button onClick={() => { setShowCreateModal(false); setEditingTrip(null); resetForm(); }} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Saving..." : editingTrip ? "Save Changes" : "Post Trip"}
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Country</label>
              <select value={formFromCountry} onChange={(e) => setFormFromCountry(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From City</label>
              <select value={formFromCity} onChange={(e) => setFormFromCity(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                {fromCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">To Country</label>
              <select value={formToCountry} onChange={(e) => setFormToCountry(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To City</label>
              <select value={formToCity} onChange={(e) => setFormToCity(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                {toCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Depart Date</label>
              <input type="date" value={formDepartDate} onChange={(e) => setFormDepartDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Return Date</label>
              <input type="date" value={formReturnDate} onChange={(e) => setFormReturnDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} min="1" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Optional notes about your trip" />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Trip Photo</label>
            <input type="file" ref={photoInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, setFormPhoto)} className="hidden" />
            {formPhoto ? (
              <div className="relative">
                <img src={formPhoto} alt="Trip photo" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => setFormPhoto(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => photoInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-primary hover:text-primary transition-colors">
                + Upload photo
              </button>
            )}
          </div>

          {/* Passport upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Passport Details Page</label>
            <input type="file" ref={passportInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, setFormPassport)} className="hidden" />
            {formPassport ? (
              <div className="relative">
                <img src={formPassport} alt="Passport" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => setFormPassport(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => passportInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-primary hover:text-primary transition-colors">
                + Upload passport page
              </button>
            )}
          </div>

          {/* Itinerary upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Travel Itinerary</label>
            <input type="file" ref={itineraryInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, setFormItinerary)} className="hidden" />
            {formItinerary ? (
              <div className="relative">
                <img src={formItinerary} alt="Itinerary" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => setFormItinerary(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => itineraryInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-primary hover:text-primary transition-colors">
                + Upload itinerary
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
