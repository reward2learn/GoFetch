"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Bell,
  Package,
  MapPin,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  closeNotificationDrawer,
  clearNotifications,
  removeNotification,
  markNotificationsAsSeen,
} from "@/redux/slices/ui.slice";
import { Avatar } from "@/components/ui/Avatar";

const NOTIFICATION_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const NOTIFICATION_BORDER_COLORS = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
  warning: "border-l-yellow-500",
} as const;

const NOTIFICATION_ICON_COLORS = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-yellow-500",
} as const;

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

interface InboxItem {
  id: string;
  orderId?: string;
  role: "owner" | "traveler";
  title: string;
  description?: string;
  imageUrl?: string;
  fromCity?: string;
  fromCountry?: string;
  toCity?: string;
  toCountry?: string;
  reward?: number | string;
  itemPrice?: number | string;
  createdAt: string;
  hasAcceptedOrders?: boolean;
  acceptedBy?: Array<{
    orderId: string;
    orderStatus: string;
    traveler?: { id: string; name?: string; avatarUrl?: string };
  }>;
  buyer?: { id: string; name?: string; avatarUrl?: string };
}

function InboxSection({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchInbox = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/inbox", { signal: controller.signal });
        if (!res.ok) { if (!ignore) setItems([]); return; }
        const data = await res.json();
        if (!ignore) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchInbox();
    return () => { ignore = true; controller.abort(); };
  }, []);

  /** Dismiss an item from the activity feed only — does NOT delete the underlying
   *  request. The actual request must be deleted from its detail page by the owner. */
  const handleDismiss = (requestId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== requestId));
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse p-3 bg-surface-1 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-surface-2 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-surface-2 rounded w-2/3 mb-1" />
                <div className="h-2 bg-surface-2 rounded w-1/2" />
              </div>
            </div>
            <div className="h-12 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-muted">
        <p className="text-sm">No active requests or deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {items.map((item) => {
        const isOwner = item.role === "owner";
        const detailPath = isOwner
          ? `/app/requests/${item.id}`
          : `/app/deliveries/${item.orderId}`;

        return (
          <div
            key={`${item.id}-${item.orderId || "own"}`}
            className="p-3 bg-surface-1 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => navigateTo(detailPath)}
          >
            {/* Header */}
            <div className="flex items-start gap-2">
              {isOwner ? (
                <Avatar name={item.acceptedBy?.[0]?.traveler?.name || "Waiting"} size="sm" />
              ) : (
                <Avatar name={item.buyer?.name || "Buyer"} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted mt-0.5">
                  {isOwner
                    ? item.hasAcceptedOrders
                      ? `Accepted by ${item.acceptedBy?.length || 0} traveler${(item.acceptedBy?.length || 0) !== 1 ? "s" : ""}`
                      : "Waiting for traveler"
                    : `Requested by ${item.buyer?.name || "Buyer"}`}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                isOwner ? "bg-info text-info" : "bg-success text-success"
              }`}>
                {isOwner ? "Owner" : "Traveler"}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {item.fromCity || item.fromCountry || "Origin"}
                {" → "}
                {item.toCity || item.toCountry || "Destination"}
              </span>
            </div>

            {/* Reward + actions row */}
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-bold text-success">
                +{formatCurrency(parseFloat(item.reward?.toString() || "0"))}
              </span>
              <div className="flex items-center gap-1.5">
                {isOwner ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateTo(`/app/requests/${item.id}`); }}
                    className="text-xs font-medium text-secondary hover:text-primary-color transition-colors"
                  >
                    View
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateTo(`/app/chat?conversation=${item.orderId}`); }}
                    className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    💬 Chat
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(item.id); }}
                    className="text-xs font-medium text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
                    aria-label="Dismiss from notifications"
                    title="Hide from notifications (to delete the request, open it and use the menu)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NotificationDrawer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const notificationDrawerOpen = useAppSelector(
    (state) => state.ui.notificationDrawerOpen
  );
  const notifications = useAppSelector((state) => state.ui.notifications);

  const handleClose = useCallback(() => {
    dispatch(closeNotificationDrawer());
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  const handleRemove = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && notificationDrawerOpen) handleClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [notificationDrawerOpen, handleClose]);

  // Mark all current notifications as seen whenever the drawer is opened,
  // so the bell-icon badge clears the next time the user looks at it.
  useEffect(() => {
    if (notificationDrawerOpen) {
      dispatch(markNotificationsAsSeen());
    }
  }, [notificationDrawerOpen, dispatch]);

  const hasActivity = true; // InboxSection handles its own loading/empty state
  const hasNotifications = notifications.length > 0;
  const isEmpty = !hasNotifications;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          notificationDrawerOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full md:w-96 flex-col bg-surface-1 shadow-xl transition-transform duration-300 ease-in-out",
          notificationDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-primary-color">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {hasNotifications && (
              <button
                onClick={handleClearAll}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-tertiary"
              >
                Clear all
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-md p-1 text-muted transition-colors hover:bg-surface-tertiary"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Section 1: Activity (Inbox content) — open requests / accepted deliveries */}
          <div className="border-b border-border">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 sticky top-0 bg-surface-1">
              <Package className="h-4 w-4 text-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Activity
              </h3>
            </div>
            <InboxSection onClose={handleClose} />
          </div>

          {/* Section 2: Recent notifications (toast-style) */}
          <div>
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 sticky top-0 bg-surface-1">
              <Bell className="h-4 w-4 text-muted" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Recent
              </h3>
            </div>
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-muted">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No recent notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type];
                  return (
                    <li
                      key={notification.id}
                      className="relative flex gap-3 border-l-4 bg-surface-1 px-4 py-3"
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full w-1 rounded-l-sm",
                          NOTIFICATION_BORDER_COLORS[notification.type]
                        )}
                      />
                      <Icon
                        className={cn(
                          "mt-0.5 h-5 w-5 shrink-0",
                          NOTIFICATION_ICON_COLORS[notification.type]
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-primary">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(notification.id)}
                        className="shrink-0 self-start rounded-md p-1 text-muted transition-colors hover:bg-surface-tertiary"
                        aria-label={`Dismiss notification: ${notification.message}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
