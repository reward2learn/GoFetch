"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { walletConnected, walletDisconnected } from "@/redux/slices/auth.slice";
import {
  setAppKitReady,
  setConnectDropdownOpen,
  syncWagmiAccount,
} from "@/redux/slices/web3.slice";
import { Button } from "@/components/ui/Button";
import { AppKitConnectButton } from "./AppKitConnectButton";
import { initAppKit, isReownConfigured } from "@/lib/web3/config";

/**
 * ConnectButton — always uses Reown AppKit for wallet connection.
 * All UI state lives in Redux (web3 slice).
 */
export function ConnectButton() {
  const dispatch = useAppDispatch();
  const { appKitReady } = useAppSelector((s) => s.web3);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  // Sync wagmi account state into Redux on every change
  useEffect(() => {
    dispatch(syncWagmiAccount({ address, isConnected }));
    if (isConnected && address) {
      dispatch(walletConnected(address));
    }
  }, [address, isConnected, dispatch]);

  // Initialize AppKit on mount — only succeeds if projectId is valid
  useEffect(() => {
    const ready = initAppKit();
    if (ready) {
      dispatch(setAppKitReady(true));
    }
  }, [dispatch]);

  // Connected state — show address + disconnect
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="relative flex items-center gap-2 px-3 py-1 bg-surface-3 rounded-lg cursor-pointer group"
          onClick={() => {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <div className="h-2 w-2 bg-success rounded-full"></div>
          <span className="text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {copied && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-1 text-xs text-surface-11 rounded shadow-lg whitespace-nowrap">
              Copied!
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 flex items-center justify-center"
          title="Disconnect wallet"
          onClick={() => {
            dispatch(walletDisconnected());
            disconnect();
          }}
        >
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
          >
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
        </Button>
      </div>
    );
  }

  // If Reown is not configured, show a disabled button with hint
  if (!isReownConfigured()) {
    return (
      <Button variant="primary" disabled>
        Wallet Unavailable
      </Button>
    );
  }

  // AppKit ready — show the modal trigger
  if (appKitReady) {
    return <AppKitConnectButton />;
  }

  // Placeholder while AppKit initializes
  return (
    <Button variant="primary" disabled>
      Initializing wallet…
    </Button>
  );
}
