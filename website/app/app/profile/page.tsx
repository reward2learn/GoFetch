"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppSelector } from "@/redux/hooks";

export default function ProfilePage() {
  const { address } = useAccount();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    fetchProfile();
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

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse flex flex-col items-center py-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-green-700">{initials}</span>
        </div>

        {/* Name + verified */}
        <div className="flex items-center gap-1.5 mb-1">
          <h1 className="text-xl font-bold">{user?.name || "Anonymous"}</h1>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        {/* Email */}
        <p className="text-sm text-gray-500 mb-3">{user?.email || "No email"}</p>

        {/* KYC badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="text-sm font-medium text-green-700">{user?.kycStatus === "verified" ? "KYC Verified" : "Unverified"}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-orange-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-sm font-bold">—</span>
            </div>
            <span className="text-xs text-gray-500">Rating</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-orange-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
              </svg>
              <span className="text-sm font-bold">0</span>
            </div>
            <span className="text-xs text-gray-500">Orders</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-orange-500 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
              <span className="text-sm font-bold">0</span>
            </div>
            <span className="text-xs text-gray-500">Trips</span>
          </div>
        </div>
      </div>

      {/* How you're protected */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold mb-4">How you&apos;re protected</h2>
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Smart-contract escrow</p>
              <p className="text-xs text-gray-500 leading-relaxed">Payment is locked until you confirm the handoff.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Traveller collateral</p>
              <p className="text-xs text-gray-500 leading-relaxed">Travellers stake 15% — slashed if they flake.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Cryptographic handoff</p>
              <p className="text-xs text-gray-500 leading-relaxed">A one-time QR scan releases funds — no disputes.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">On-chain reputation</p>
              <p className="text-xs text-gray-500 leading-relaxed">Reviews build permanent trust.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      {address && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-lg font-bold mb-3">Wallet</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Address</span>
            <span className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
