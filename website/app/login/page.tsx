"use client";

import { useState, useRef, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { isReownConfigured, initAppKit } from "@/lib/web3/config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  signInWithWallet,
  walletConnected,
  walletDisconnected,
} from "@/redux/slices/auth.slice";
import { useEffect } from "react";

const ConnectButton = dynamic(
  () => import("@/components/web3/ConnectButton").then((m) => m.ConnectButton),
  { ssr: false }
);

export default function LoginPage() {
  const configured = isReownConfigured();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading, error: authError, walletConnected: reduxWalletConnected } = useAppSelector((s) => s.auth);
  const [localError, setLocalError] = useState<string | null>(null);
  const signInInitiated = useRef(false);

  // Initialize AppKit (technical, not auth logic)
  useEffect(() => {
    initAppKit();
  }, []);

  // Derive sign-in state from Redux — no useEffect needed
  const shouldSignIn = reduxWalletConnected && !isAuthenticated && !authLoading && !signInInitiated.current;
  const displayError = authError || localError;

  // Trigger sign-in when Redux state says we should
  // This is the ONLY useEffect for auth — it reacts to Redux state, not raw wallet events
  useEffect(() => {
    if (!shouldSignIn || !address) return;

    signInInitiated.current = true;
    dispatch(signInWithWallet({ address, signMessageAsync }));
  }, [shouldSignIn, address, signMessageAsync, dispatch]);

  // Sync wallet state to Redux — single source of truth
  useEffect(() => {
    if (isConnected && address) {
      dispatch(walletConnected(address));
    } else if (!isConnected) {
      dispatch(walletDisconnected());
      signInInitiated.current = false;
    }
  }, [isConnected, address, dispatch]);

  // Redirect on successful auth
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/explore");
    }
  }, [isAuthenticated, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // safety net — the thunk handles its own timeout
    };
  }, []);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-primary">GoFetch</h1>
          <p className="text-text-secondary mt-2">
            P2P Global Shopping &amp; Delivery
          </p>
        </div>

        <div className="mb-6">
          {authLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
              <p className="text-sm text-text-secondary">Signing in...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-tertiary mb-4">
                Connect your wallet to start buying or delivering items worldwide.
              </p>
              <ConnectButton />
            </>
          )}
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{displayError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setLocalError(null);
                signInInitiated.current = false;
                dispatch({ type: "auth/clearError" });
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {!configured && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <p className="text-xs font-semibold text-yellow-800 mb-1">
              ⚠️ Reown Project ID not configured
            </p>
            <p className="text-xs text-yellow-700">
              Add to <code className="bg-yellow-100 px-1 rounded">.env.local</code>:
            </p>
            <code className="block mt-1 text-xs bg-yellow-100 p-2 rounded">
              NEXT_PUBLIC_REOWN_PROJECT_ID=your-project-id
            </code>
          </div>
        )}

        <div className="text-xs text-text-tertiary mt-4">
          <p>Powered by USDC on Base Sepolia</p>
        </div>
      </Card>
    </div>
  );
}
