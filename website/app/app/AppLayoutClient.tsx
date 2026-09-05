"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AppNavbar } from "@/components/layouts/AppNavbar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { BottomNav } from "@/components/layouts/BottomNav";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import TermsAcceptGate from "@/components/terms/TermsAcceptGate";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { checkSession } from "@/redux/slices/auth.slice";
import { useBrand } from "@/components/providers/BrandProvider";

function LoadingScreen() {
  const brand = useBrand();
  return (
    <div className="flex items-center justify-center h-screen bg-surface-0">
      {brand.loadingGraphic ? (
        <img
          src={brand.loadingGraphic}
          alt="Loading..."
          className="w-24 h-24 object-cover animate-pulse"
        />
      ) : (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      )}
    </div>
  );
}

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isConnected } = useAccount();
  const { isAuthenticated, sessionChecked, isLoading } = useAppSelector((s) => s.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check session on mount
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Wallet checks
  const prevConnected = useRef(isConnected);
  const hasConnected = useRef(isConnected);
  const walletCheckReady = useRef(false);

  // After session check completes, give wagmi a moment to reconnect, then enforce wallet check
  useEffect(() => {
    if (!sessionChecked) return;
    // Give wagmi 1s to auto-reconnect from storage
    const timer = setTimeout(() => {
      walletCheckReady.current = true;
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionChecked]);

  useEffect(() => {
    if (isConnected) hasConnected.current = true;

    // Redirect if wallet disconnects after being connected
    if (hasConnected.current && prevConnected.current && !isConnected) {
      router.replace("/login");
    }

    // Redirect if session is valid but wallet was never connected (after grace period)
    if (sessionChecked && isAuthenticated && walletCheckReady.current && !isConnected) {
      router.replace("/login");
    }

    prevConnected.current = isConnected;
  }, [isConnected, router, sessionChecked, isAuthenticated]);

  // Redirect to login if session check done and not authenticated
  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.replace("/login");
    }
  }, [sessionChecked, isAuthenticated, router]);

  // Loading state while checking session
  if (!sessionChecked || (isLoading && !isAuthenticated)) {
    return <LoadingScreen />;
  }

  // Not authenticated — redirect in progress
  if (!isAuthenticated) {
    return null;
  }

  return (
    <TermsAcceptGate>
      <div className="flex h-screen bg-surface-0">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile sidebar overlay — full screen */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <AppSidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              isMobile
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppNavbar
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
            onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
        </div>

        {/* Bottom nav — mobile only */}
        <BottomNav />

        {/* Notification drawer */}
        <NotificationDrawer />
      </div>
    </TermsAcceptGate>
  );
}
