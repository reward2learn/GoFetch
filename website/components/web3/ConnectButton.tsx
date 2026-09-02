"use client";

import { useEffect } from "react";
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
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-tertiary rounded-lg">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dispatch(walletDisconnected());
            disconnect();
          }}
        >
          Disconnect
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
