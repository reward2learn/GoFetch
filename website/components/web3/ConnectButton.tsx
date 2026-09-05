"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { walletConnected, walletDisconnected } from "@/redux/slices/auth.slice";
import { syncWagmiAccount } from "@/redux/slices/web3.slice";
import { Button } from "@/components/ui/Button";
import { isReownConfigured } from "@/lib/web3/config";

/**
 * ConnectButton — uses Reown AppKit for wallet connection with social logins.
 */
export function ConnectButton() {
  const dispatch = useAppDispatch();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [copied, setCopied] = useState(false);

  // Sync wagmi account state into Redux on every change
  useEffect(() => {
    dispatch(syncWagmiAccount({ address, isConnected }));
    if (isConnected && address) {
      dispatch(walletConnected(address));
    }
  }, [address, isConnected, dispatch]);

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
          <span className="text-sm font-mono" title={address} >
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
           {/* {address.slce(0, 6)}...{address.slice(-4)} */}
          </span>
          {copied && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-1 text-xs text-surface-11 rounded shadow-lg whitespace-nowrap">
              Copied!
            </div>
          )}
        </div>
        {/* <Button
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
        </Button> */}
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

  // AppKit ready — show the modal trigger using useAppKit hook
  return (
    <Button variant="primary" onClick={() => open()}>
      Connect
    </Button>
  );
}
