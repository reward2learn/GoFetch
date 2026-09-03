"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

/* ─── Inbox Tab ─── */
function InboxTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchInbox = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/requests?status=OPEN", { signal: controller.signal });
        if (!res.ok) { if (!ignore) setRequests([]); return; }
        const data = await res.json();
        if (!ignore) setRequests(Array.isArray(data) ? data : data.requests || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setRequests([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchInbox();
    return () => { ignore = true; controller.abort(); };
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, { method: "POST" });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-4 bg-surface-1 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-surface-2 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-surface-2 rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-24">
      {requests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <p className="font-semibold text-primary mb-1">Your inbox is empty</p>
          <p className="text-sm text-muted">Post a travel plan and requests matching your route will land here automatically.</p>
        </div>
      ) : (
        requests.map((req: any) => (
          <div key={req.id} className="p-4 bg-surface-1 rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <Avatar name={req.user?.name || req.requesterName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {req.user?.name || req.requesterName || "Anonymous"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-sm mt-3">{req.description || "No description"}</p>

            {req.imageUrl && (
              <img
                src={req.imageUrl}
                alt="Request"
                className="mt-3 w-full h-40 object-cover rounded-lg border border-border"
              />
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted">
              {req.fromAirport && <span>✈️ {req.fromAirport}</span>}
              {req.toAirport && <span> → {req.toAirport}</span>}
            </div>

            {req.deliveryType === "CLICK_AND_COLLECT" && req.pickupLocation && (
              <p className="text-xs text-muted mt-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
                Pickup: {req.pickupLocation}
              </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-sm font-bold text-primary-color">
                {req.reward != null ? `${Number(req.reward).toLocaleString()} K` : req.itemPrice != null ? `${Number(req.itemPrice).toLocaleString()} K` : "—"}
              </span>
              <Button variant="primary" onClick={() => handleAccept(req.id)}>
                Accept Delivery
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Messages Tab ─── */
function MessagesTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat/conversations", { signal: controller.signal });
        if (!ignore) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchConversations();
    return () => { ignore = true; controller.abort(); };
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;

    const controller = new AbortController();
    let ignore = false;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedConversation.id}/messages`, { signal: controller.signal });
        if (!ignore) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    };

    fetchMessages();
    return () => { ignore = true; controller.abort(); };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await fetch(`/api/chat/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage }),
      });
      if (res.ok) {
        const sentMsg = await res.json();
        setMessages((prev) => [...prev, sentMsg]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Conversations List — hidden on mobile when conversation selected */}
      <div className={`${
        selectedConversation ? "hidden md:block" : "block"
      } w-full md:w-80 border-r border-border bg-surface-1 shrink-0`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="overflow-auto">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-2 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-surface-2 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-surface-2 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-border text-left hover:bg-surface-2 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? "bg-surface-2"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={conv.otherUser?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.otherUser?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area — hidden on mobile when no conversation selected */}
      <div className={`${
        !selectedConversation ? "hidden md:flex" : "flex"
      } flex-1 flex-col min-w-0`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-surface-1">
              <div className="flex items-center gap-3">
                <Avatar name={selectedConversation.otherUser?.name} size="md" />
                <div>
                  <p className="font-semibold">
                    {selectedConversation.otherUser?.name}
                  </p>
                  <p className="text-sm text-muted">
                    Order #{selectedConversation.orderId?.slice(0, 8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.isOwn
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-primary-color"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.isOwn ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-surface-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button variant="primary" onClick={sendMessage}>
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-muted">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ChatPage() {
  const [tab, setTab] = useState<"inbox" | "messages">("messages");

  return (
    <div className="p-4 space-y-4">
      {/* Pill tabs */}
      <div className="flex gap-2">
        {(["inbox", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-white"
                : "bg-surface-2 text-secondary hover:bg-surface-hover"
            }`}
          >
            {t === "inbox" ? "Inbox" : "Messages"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "inbox" ? <InboxTab /> : <MessagesTab />}
    </div>
  );
}
