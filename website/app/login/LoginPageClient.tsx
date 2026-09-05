"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import dynamicImport from "next/dynamic";
import { isReownConfigured } from "@/lib/web3/config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  checkSession,
  signInWithWallet,
  clearError,
} from "@/redux/slices/auth.slice";
import { useBrand } from "@/components/providers/BrandProvider";

const ConnectButton = dynamicImport(
  () => import("@/components/web3/ConnectButton").then((m) => m.ConnectButton),
  { ssr: false }
);

export default function LoginPageClient() {
  const configured = isReownConfigured();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const brand = useBrand();
  const {
    isAuthenticated,
    isLoading: authLoading,
    sessionChecked,
    error: authError,
    walletConnected: reduxWalletConnected,
  } = useAppSelector((s) => s.auth);

  // Guard: prevent re-triggering sign-in after a failed attempt
  const signInAttempted = useRef(false);
  const prevAddress = useRef<string | undefined>(undefined);
  const signMessageAsyncRef = useRef(signMessageAsync);
  
  // Keep ref in sync with latest signMessageAsync
  useEffect(() => {
    signMessageAsyncRef.current = signMessageAsync;
  }, [signMessageAsync]);

  // Reset the guard when address changes (new wallet connection)
  useEffect(() => {
    if (address !== prevAddress.current) {
      signInAttempted.current = false;
      prevAddress.current = address;
    }
  }, [address]);

  // Check existing session on mount
  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  // Stable sign-in trigger using ref for signMessageAsync to avoid re-triggering
  const triggerSignIn = useCallback(() => {
    if (
      sessionChecked &&
      reduxWalletConnected &&
      address &&
      !isAuthenticated &&
      !authLoading &&
      !signInAttempted.current
    ) {
      signInAttempted.current = true;
      dispatch(signInWithWallet({ address, signMessageAsync: signMessageAsyncRef.current }));
    }
  }, [sessionChecked, reduxWalletConnected, address, isAuthenticated, authLoading, dispatch]);

  // Trigger SIWE sign-in when wallet is connected and session check is done
  useEffect(() => {
    triggerSignIn();
  }, [triggerSignIn]);

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
          {brand.logo ? (
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="h-12 mx-auto mb-3 object-contain"
            />
          ) : null}
          <h1 className="text-3xl font-bold text-primary-color">{brand.name}</h1>
          <p className="text-text-secondary mt-2">
            {brand.loginTagline}
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
                {brand.loginSubtitle}
              </p>
              <ConnectButton />
            </>
          )}
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-sm text-error">{authError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                // Reset sign-in guard and clear error
                signInAttempted.current = false;
                dispatch(clearError());
                // Re-trigger sign-in after a short delay
                setTimeout(() => {
                  triggerSignIn();
                }, 100);
              }}
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
          <p>{brand.poweredBy}</p>
        </div>
      </Card>
    </div>
  );
}
