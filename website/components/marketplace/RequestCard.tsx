"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import moment from "moment";

const CATEGORY_IMAGES: Record<string, string> = {
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  Travel: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop",
  Other: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    category?: string;
    outletName?: string;
    imageUrl?: string;
    itemPrice: number;
    reward: number;
    fromCity?: string;
    fromCountry?: string;
    toCity?: string;
    toCountry?: string;
    status: string;
    archiveReason?: string;
    deliveryType?: string;
    deadline?: string | null;
    buyerId?: string;
    buyer?: { id: string; name?: string };
  };
  isAdmin?: boolean;
  onEdit?: (request: RequestCardProps["request"]) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, reason: string) => void;
}

function getStatusClasses(color: string): string {
  switch (color) {
    case "success": return "bg-success/15 text-success";
    case "error": return "bg-error/15 text-error";
    case "warning": return "bg-warning/15 text-warning";
    case "info": return "bg-info/15 text-info";
    default: return "bg-surface-2 text-muted";
  }
}

function getStatusColor(status: string): { color: string; label: string } {
  switch (status) {
    case "open": return { color: "info", label: "Open" };
    case "in_progress": return { color: "warning", label: "In Progress" };
    case "completed": return { color: "success", label: "Completed" };
    case "cancelled": return { color: "error", label: "Cancelled" };
    case "offered": return { color: "info", label: "Offered" };
    case "agreed": return { color: "warning", label: "Agreed" };
    case "funded": return { color: "success", label: "Funded" };
    case "purchased": return { color: "success", label: "Purchased" };
    case "in_transit": return { color: "warning", label: "In Transit" };
    case "arrived": return { color: "success", label: "Arrived" };
    case "handoff_pending": return { color: "warning", label: "Handoff Pending" };
    default: return { color: "info", label: status };
  }
}

export function RequestCard({ request, isAdmin: isAdminUser, onEdit, onDelete, onArchive }: RequestCardProps) {
  const router = useRouter();
  const image = request.imageUrl || CATEGORY_IMAGES[request.category || "Other"] || DEFAULT_IMAGE;
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const favs = JSON.parse(localStorage.getItem("gf-favorites") || "[]");
      return favs.includes(request.id);
    } catch { return false; }
  });

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((prev: boolean) => {
      const next = !prev;
      try {
        const favs = JSON.parse(localStorage.getItem("gf-favorites") || "[]");
        if (next) {
          if (!favs.includes(request.id)) favs.push(request.id);
        } else {
          const idx = favs.indexOf(request.id);
          if (idx >= 0) favs.splice(idx, 1);
        }
        localStorage.setItem("gf-favorites", JSON.stringify(favs));
      } catch {}
      return next;
    });
  };

  const shareRequest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/app/requests/${request.id}`;
    const shareData = {
      title: request.title,
      text: `Check out this delivery request: ${request.title}`,
      url: url,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — fallback to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      // Web Share API not supported — fallback to clipboard
      navigator.clipboard.writeText(url);
    }
  };

  const statusInfo = getStatusColor(request.status);

  return (
    <div className="relative group">
      <Link href={`/app/requests/${request.id}`}>
        <div className="bg-surface-1 rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col">
          {/* Image — fixed 320px */}
          <div className="relative overflow-hidden" style={{ height: "320px", minHeight: "320px", maxHeight: "320px" }}>
            <img
              src={image}
              alt={request.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Category badge */}
            <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white shadow-sm">
              {request.category || "Other"}
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col p-3 flex-1">
            {/* Row 1: Item Name */}
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{request.title}</h3>

            {/* Row 2: Outlet Name */}
            {request.outletName && (
              <p className="text-xs text-muted mt-0.5">{request.outletName}</p>
            )}

            {/* Row 3: Route */}
            <div className="flex items-center gap-1 text-xs text-secondary mt-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>
                {request.fromCity && request.fromCountry
                  ? `${request.fromCity}, ${request.fromCountry}`
                  : "Origin TBD"}
                {" → "}
                {request.toCity && request.toCountry
                  ? `${request.toCity}, ${request.toCountry}`
                  : "Destination TBD"}
              </span>
            </div>

            {/* Row 4: Delivery Reward label */}
            <p className="text-xs text-muted mt-2">Delivery Reward</p>

            {/* Row 5: Reward amount */}
            <p className="font-bold text-lg text-primary-color">+{formatCurrency(request.reward)}</p>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              {/* Left: Favourite + Share */}
              <div className="flex items-center gap-2">
                {/* Heart */}
                <button
                  onClick={toggleFavorite}
                  className={`p-1 transition-colors ${isFavorited ? "text-error" : "text-muted hover:text-error"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                </button>
                {/* Share */}
                <button
                  onClick={shareRequest}
                  className="p-1 text-muted hover:text-primary-color transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                  </svg>
                </button>
              </div>

              {/* Right: Delivery Date + Status */}
              <div className="flex items-center gap-2">
                {/* Delivery Date */}
                {request.deadline && (
                  <div className="text-right">
                    <p className="text-[10px] text-muted leading-none">Delivery Date</p>
                    <p className="text-xs font-medium text-secondary">
                      {moment(request.deadline).format("DD/MM/YY")}
                      {" "}
                      <span className="text-muted">({(() => {
                        const diff = moment(request.deadline).diff(moment(), "hours");
                        return diff > 0 ? `${diff}hr` : "Overdue";
                      })()})</span>
                    </p>
                  </div>
                )}

                {/* Status with info tooltip */}
                <div className="relative group/tip">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${getStatusClasses(statusInfo.color)}`}>
                    {statusInfo.label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 w-56 p-2.5 bg-surface-1 border border-border rounded-lg shadow-lg text-xs text-secondary leading-relaxed opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none">
                    {request.status === "open" && (
                      <>
                        <p className="font-medium text-primary mb-1">Open — Awaiting Traveler</p>
                        <p>This delivery request is published and visible to all travelers. No one has claimed it yet. The requester is waiting for a traveler heading this route to accept the job.</p>
                      </>
                    )}
                    {request.status === "in_progress" && (
                      <>
                        <p className="font-medium text-primary mb-1">In Progress</p>
                        <p>A traveler has accepted this request and is working on fulfilling the delivery.</p>
                      </>
                    )}
                    {request.status === "completed" && (
                      <>
                        <p className="font-medium text-primary mb-1">Completed</p>
                        <p>The delivery has been fulfilled and the order is closed.</p>
                      </>
                    )}
                    {request.status === "cancelled" && (
                      <>
                        <p className="font-medium text-primary mb-1">Cancelled</p>
                        <p>This request was cancelled by the requester.</p>
                      </>
                    )}
                    {!["open", "in_progress", "completed", "cancelled"].includes(request.status) && (
                      <p className="font-medium text-primary">{statusInfo.label}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Three-dot menu overlay — top right on hover */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-surface-hover-strong backdrop-blur-sm transition-colors"
            aria-label="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-surface-1 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); router.push(`/app/requests/${request.id}`); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                View Details
              </button>

              {/* See all items from this owner */}
              {request.buyerId && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); router.push(`/app/explore?buyerId=${request.buyerId}`); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  See all from {request.buyer?.name || "this owner"}
                </button>
              )}

              {onEdit && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(request); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                  </svg>
                  Edit Request
                </button>
              )}

              {/* Admin Archive */}
              {isAdminUser && request.status !== "archived" && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); setShowArchiveModal(true); setArchiveReason(""); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-warning hover:bg-warning/10 transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>
                  </svg>
                  Archive Request
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(request.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Delete Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowArchiveModal(false)}>
          <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Archive Request</h3>
            <p className="text-sm text-muted mb-4">Select a reason for removing this item from the platform.</p>

            <div className="space-y-2 mb-4">
              {["Duplicate listing", "Item no longer available", "Policy violation", "Fraudulent listing", "Other"].map((reason) => (
                <label key={reason} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-hover cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="archive-reason"
                    value={reason}
                    checked={archiveReason === reason}
                    onChange={() => setArchiveReason(reason)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!archiveReason || !onArchive) return;
                  setArchiving(true);
                  try {
                    await onArchive(request.id, archiveReason);
                    setShowArchiveModal(false);
                  } finally {
                    setArchiving(false);
                  }
                }}
                disabled={!archiveReason || archiving}
                className="px-4 py-2 text-sm bg-warning text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {archiving ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
