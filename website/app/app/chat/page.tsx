import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-white">Messages</div>
            <div className="px-5 py-2 rounded-full text-sm font-medium bg-surface-2 text-secondary">Inbox</div>
          </div>
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
