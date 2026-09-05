import { Suspense } from "react";
import AppLayoutClient from "./AppLayoutClient";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-surface-0">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AppLayoutClient>{children}</AppLayoutClient>
    </Suspense>
  );
}
