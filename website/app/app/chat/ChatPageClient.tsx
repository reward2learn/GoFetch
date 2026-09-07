"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchConversations, fetchMessages, sendMessage, setCurrentConversation } from "@/redux/slices/chat.slice";
import { selectChatConversations, selectChatCurrentConversation, selectChatMessages, selectChatIsLoading } from "@/redux/selectors";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

/* ─── Messages Tab ─── */
function MessagesTab() {
  const searchParams = useSearchParams();
  const conversationOrderId = searchParams.get("conversation");
  const conversations = useAppSelector(selectChatConversations);
  const selectedConversation = useAppSelector(selectChatCurrentConversation);
  const messages = useAppSelector(selectChatMessages);
  const isLoading = useAppSelector(selectChatIsLoading);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Auto-select conversation from URL param
  useEffect(() => {
    if (!conversationOrderId || conversations.length === 0 || selectedConversation) return;
    const match = conversations.find((c: any) => c.orderId === conversationOrderId);
    if (match) dispatch(setCurrentConversation(match));
  }, [conversationOrderId, conversations, selectedConversation, dispatch]);

  useEffect(() => {
    if (!selectedConversation) return;
    dispatch(fetchMessages(selectedConversation.id)).unwrap();
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await dispatch(sendMessage({ conversationId: selectedConversation.id, content: newMessage })).unwrap();
      setNewMessage("");
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
          <h2 className="text-xl font-semibold">Conversations</h2>
        </div>
        <div className="overflow-auto">
          {isLoading ? (
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
                onClick={() => dispatch(setCurrentConversation(conv))}
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
                <Avatar name={(selectedConversation as any).otherUser?.name} size="md" />
                <div>
                  <p className="font-semibold">
                    {(selectedConversation as any).otherUser?.name}
                  </p>
                  <p className="text-sm text-muted">
                    Order #{(selectedConversation as any).orderId?.slice(0, 8)}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button variant="primary" onClick={handleSendMessage}>
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
  return (
    <div className="p-0 space-y-0">
      {/* Sticky header — no title; conversation list is the primary content */}
      <div className="sticky top-0 z-20 bg-surface-1 p-4 border-b border-border" />

      {/* Content */}
      <MessagesTab />
    </div>
  );
}
