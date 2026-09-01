"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AppNavbar } from "@/components/layouts/AppNavbar";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { BottomNav } from "@/components/layouts/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useAccount();
  const [checked, setChecked] = useState(false);
  const isLoading = status === "reconnecting" || status === "connecting";

  // Only redirect on initial mount, not on every render
  useEffect(() => {
    let cancelled = false;

    if (!isLoading) {
      setChecked(true);
      if (!isConnected && !cancelled) {
        router.replace("/login");
      }
    }

    return () => { cancelled = true; };
  }, [isConnected, isLoading, router]);

  // Show loading only during initial wallet reconnection
  if (!checked && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // If checked and not connected, show nothing (redirect is happening)
  if (checked && !isConnected) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppNavbar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
