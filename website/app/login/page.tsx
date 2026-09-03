"use client";

import { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { isReownConfigured, initAppKit } from "@/lib/web3/config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  checkSession,
  signInWithWallet,
  clearError,
} from "@/redux/slices/auth.slice";

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
  const {
    isAuthenticated,
    isLoading: authLoading,
    sessionChecked,
    error: authError,
    walletConnected: reduxWalletConnected,
  } = useAppSelector((s) => s.auth);

  // Initialize AppKit
  useEffect(() => {
    initAppKit();
  }, []);

  // Check existing session on mount
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Trigger SIWE sign-in when wallet is connected and session check is done
  useEffect(() => {
    if (sessionChecked && reduxWalletConnected && address && !isAuthenticated && !authLoading) {
      dispatch(signInWithWallet({ address, signMessageAsync }));
    }
  }, [sessionChecked, reduxWalletConnected, address, isAuthenticated, authLoading, dispatch, signMessageAsync]);

  // Redirect on successful auth
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/explore");
    }
  }, [isAuthenticated, router]);

  // Derive what to show
  const showChecking = !sessionChecked;
  const showSigning = sessionChecked && authLoading && !isAuthenticated;
  const showConnect = sessionChecked && !authLoading && !isAuthenticated;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-color">GoFetch</h1>
          <p className="text-text-secondary mt-2">
            P2P Global Shopping &amp; Delivery
          </p>
        </div>

        <div className="mb-6">
          {showChecking ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-text-secondary">Checking session...</p>
            </div>
          ) : showSigning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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

        {authError && (
          <div className="mb-4 p-3 bg-error border border-error rounded-lg">
            <p className="text-sm text-error">{authError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => dispatch(clearError())}
            >
              Try Again
            </Button>
          </div>
        )}

        {!configured && (
          <div className="mt-4 p-3 bg-warning border border-warning rounded-lg text-left">
            <p className="text-xs font-semibold text-warning mb-1">
              ⚠️ Reown Project ID not configured
            </p>
            <p className="text-xs text-warning">
              Add to <code className="bg-warning px-1 rounded">.env.local</code>:
            </p>
            <code className="block mt-1 text-xs bg-warning p-2 rounded">
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
