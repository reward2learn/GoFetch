"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
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
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-border bg-surface-1">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="overflow-auto">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-surface-tertiary rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-surface-tertiary rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
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
                className={`w-full p-4 border-b border-border text-left hover:bg-surface-tertiary transition-colors ${
                  selectedConversation?.id === conv.id
                    ? "bg-surface-tertiary"
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
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
                    Order #
                    {selectedConversation.orderId?.slice(0, 8)}
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
                        ? "bg-brand-primary text-white"
                        : "bg-surface-tertiary text-brand-primary"
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
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <Button variant="primary" onClick={sendMessage}>
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
