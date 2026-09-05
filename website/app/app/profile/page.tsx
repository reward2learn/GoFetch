"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAppSelector } from "@/redux/hooks";
import Link from "next/link";

export default function ProfilePage() {
  const { address } = useAccount();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setUser(data);
        } else if (authUser) {
          if (!ignore) setUser(authUser);
        }
      } catch {
        if (!ignore && authUser) setUser(authUser);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/orders", { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.orders || data.items || [];
          if (!ignore) {
            setOrderCount(items.filter((o: any) => o.role === "buyer").length);
            setTripCount(items.filter((o: any) => o.role === "traveler").length);
          }
        }
      } catch {
        // silently ignore
      }
    };

    fetchProfile();
    fetchCounts();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const initials = user?.name
    ? user.name.startsWith("0x")
      ? "GF"
      : user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: base64 }),
        });
        if (res.ok) {
          setUser((prev: any) => ({ ...prev, avatarUrl: base64 }));
        }
      } catch {
        // silently ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditName = () => {
    setEditName(user?.name || "");
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== user?.name) {
      try {
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (res.ok) {
          setUser((prev: any) => ({ ...prev, name: trimmed }));
        }
      } catch {
        // silently ignore
      }
    }
    setEditingName(false);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse flex flex-col items-center py-8">
          <div className="w-24 h-24 bg-surface-2 rounded-full mb-4" />
          <div className="h-6 bg-surface-2 rounded w-1/3 mb-2" />
          <div className="h-4 bg-surface-2 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-surface-1 rounded-2xl border border-border p-6 flex flex-col items-center">
        {/* Avatar — clickable to upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative group w-24 h-24 rounded-full bg-success overflow-hidden mb-4 shrink-0"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary-color flex items-center justify-center w-full h-full">
              {initials}
            </span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* Name — editable inline */}
        {editingName ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") setEditingName(false);
            }}
            autoFocus
            className="text-xl font-bold text-center bg-transparent border-b-2 border-primary outline-none mb-1"
          />
        ) : (
          <div
            className="flex items-center gap-1.5 mb-1 cursor-pointer group"
            onClick={startEditName}
          >
            <h1 className="text-xl font-bold">{user?.name || "Anonymous"}</h1>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>
        )}

        {/* Email */}
        <p className="text-sm text-muted mb-3">{user?.email || "No email"}</p>

        {/* KYC badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success rounded-full mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="text-sm font-medium text-primary-color">{user?.kycStatus === "verified" ? "KYC Verified" : "Unverified"}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-sm font-bold">—</span>
            </div>
            <span className="text-xs text-muted">Rating</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
              </svg>
              <span className="text-sm font-bold">{orderCount}</span>
            </div>
            <span className="text-xs text-muted">Orders</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
              <span className="text-sm font-bold">{tripCount}</span>
            </div>
            <span className="text-xs text-muted">Trips</span>
          </div>
        </div>
      </div>

      {/* Account Info — above How you're protected */}
      {address && (
        <div
          className="bg-surface-1 rounded-2xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={copyAddress}
        >
          <h2 className="text-lg font-bold mb-3">Account</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Address</span>
            <span className="font-mono text-xs flex items-center gap-2">
              {address.slice(0, 6)}...{address.slice(-4)}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </span>
          </div>
          {copied && (
            <div className="absolute -top-2 right-4 px-2 py-1 bg-success text-white text-xs rounded-full shadow-lg">
              Copied!
            </div>
          )}
        </div>
      )}

      {/* How you're protected */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-bold mb-4">How you&apos;re protected</h2>
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Smart-contract escrow</p>
              <p className="text-xs text-muted leading-relaxed">Payment is locked until you confirm the handoff.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Traveller collateral</p>
              <p className="text-xs text-muted leading-relaxed">Travellers stake 15% — slashed if they flake.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Cryptographic handoff</p>
              <p className="text-xs text-muted leading-relaxed">A one-time QR scan releases funds — no disputes.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">On-chain reputation</p>
              <p className="text-xs text-muted leading-relaxed">Reviews build permanent trust.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings link */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5">
        <Link
          href="/app/settings"
          className="flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Settings</p>
              <p className="text-xs text-muted">Account, theme, and preferences</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary-color transition-colors">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
