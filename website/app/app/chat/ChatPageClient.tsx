"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

/* ─── Inbox Tab ─── */
function InboxTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`/api/requests/${requestId}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== requestId));
      }
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 bg-surface-1 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-surface-2 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-surface-2 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-surface-2 rounded w-1/2" />
                </div>
              </div>
              <div className="h-20 bg-surface-2 rounded mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <p className="font-semibold text-primary mb-1">Your inbox is empty</p>
          <p className="text-sm text-muted">Post a request or accept a delivery to start conversations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => {
            const isOwner = item.role === "owner";
            const isTraveler = item.role === "traveler";

            return (
              <div key={`${item.id}-${item.orderId || "own"}`} className="p-4 bg-surface-1 rounded-xl border border-border flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3">
                  {isOwner ? (
                    <Avatar name={item.acceptedBy?.[0]?.traveler?.name || "Waiting"} size="md" />
                  ) : (
                    <Avatar name={item.buyer?.name || "Buyer"} size="md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {isOwner ? (
                        item.hasAcceptedOrders
                          ? `Accepted by ${item.acceptedBy.length} traveler${item.acceptedBy.length !== 1 ? "s" : ""}`
                          : "Waiting for traveler"
                      ) : (
                        `Requested by ${item.buyer?.name || "Buyer"}`
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Role badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOwner ? "bg-info text-info" : "bg-success text-success"
                  }`}>
                    {isOwner ? "Owner" : "Traveler"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-secondary mt-3 line-clamp-2">{item.description || "No description"}</p>

                {/* Image */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="mt-3 w-full h-32 object-cover rounded-lg border border-border"
                  />
                )}

                {/* Route */}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                  <span>{item.fromCity || item.fromCountry || "Origin"}</span>
                  <span>→</span>
                  <span>{item.toCity || item.toCountry || "Destination"}</span>
                </div>

                {/* Accepted travelers list (for owner) */}
                {isOwner && item.hasAcceptedOrders && (
                  <div className="mt-3 space-y-1">
                    {item.acceptedBy.slice(0, 2).map((accepted: any) => (
                      <div key={accepted.orderId} className="flex items-center gap-2 text-xs">
                        <Avatar name={accepted.traveler?.name} size="sm" />
                        <span className="text-secondary truncate">{accepted.traveler?.name || "Traveler"}</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          accepted.orderStatus === "agreed" ? "bg-warning text-warning" :
                          accepted.orderStatus === "completed" ? "bg-success text-success" :
                          "bg-surface-2 text-muted"
                        }`}>
                          {accepted.orderStatus}
                        </span>
                      </div>
                    ))}
                    {item.acceptedBy.length > 2 && (
                      <p className="text-xs text-muted">+{item.acceptedBy.length - 2} more</p>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-bold text-success">
                    +{formatCurrency(parseFloat(item.reward?.toString() || "0"))}
                  </span>
                  <span className="text-xs text-muted">
                    Item: {formatCurrency(parseFloat(item.itemPrice?.toString() || "0"))}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => router.push(`/app/requests/${item.id}`)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => router.push(`/app/requests/${item.id}`)}
                        className="px-3 py-2 text-xs font-medium text-secondary border border-border rounded-full hover:bg-surface-2 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 text-xs font-medium text-error border border-error/30 rounded-full hover:bg-error/10 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/app/deliveries/${item.orderId}`)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
                      >
                        View Delivery
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/app/chat?conversation=${item.orderId}`);
                        }}
                        className="px-3 py-2 text-xs font-medium text-secondary border border-border rounded-full hover:bg-surface-2 transition-colors"
                      >
                        💬
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Messages Tab ─── */
function MessagesTab() {
  const searchParams = useSearchParams();
  const conversationOrderId = searchParams.get("conversation");
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
          setConversations(Array.isArray(data) ? data : []);
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

  // Auto-select conversation from URL param
  useEffect(() => {
    if (!conversationOrderId || conversations.length === 0 || selectedConversation) return;
    const match = conversations.find((c: any) => c.orderId === conversationOrderId);
    if (match) setSelectedConversation(match);
  }, [conversationOrderId, conversations, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;

    const controller = new AbortController();
    let ignore = false;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedConversation.id}/messages`, { signal: controller.signal });
        if (!ignore) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
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

/* ─── Client Page ─── */
export default function ChatPageClient() {
  const searchParams = useSearchParams();
  const hasConversation = !!searchParams.get("conversation");
  const [tab, setTab] = useState<"inbox" | "messages">(hasConversation ? "messages" : "messages");

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
