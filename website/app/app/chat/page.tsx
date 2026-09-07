import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="p-0 space-y-0">
          <div className="sticky top-0 z-20 bg-surface-1 p-4 border-b border-border" />
          <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-muted">
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}
