"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AppNavbar } from "@/components/layouts/AppNavbar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { BottomNav } from "@/components/layouts/BottomNav";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { checkSession } from "@/redux/slices/auth.slice";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isConnected } = useAccount();
  const { isAuthenticated, sessionChecked, isLoading } = useAppSelector((s) => s.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check session on mount — single source of truth
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Redirect to login if session check done and not authenticated
  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.replace("/login");
    }
  }, [sessionChecked, isAuthenticated, router]);

  // Loading state while checking session
  if (!sessionChecked || (isLoading && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated — redirect in progress
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppNavbar
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Notification drawer */}
      <NotificationDrawer />
    </div>
  );
}
