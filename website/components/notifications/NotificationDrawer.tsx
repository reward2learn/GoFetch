"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  closeNotificationDrawer,
  clearNotifications,
  removeNotification,
} from "@/redux/slices/ui.slice";

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

export function NotificationDrawer() {
  const dispatch = useAppDispatch();
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
          "fixed right-0 top-0 z-50 flex h-full w-full md:w-80 flex-col bg-surface-1 shadow-xl transition-transform duration-300 ease-in-out",
          notificationDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold text-primary-color">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
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

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
            <Bell className="h-10 w-10 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              return (
                <li
                  key={notification.id}
                  className="relative flex gap-3 border-l-4 bg-surface-1 px-4 py-3"
                >
                  {/* Colored left border applied via class */}
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
    </>
  );
}
