"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { isReownConfigured, initAppKit } from "@/lib/web3/config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/auth.slice";

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
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSignedIn = useRef(false);
  const wasConnected = useRef(false);
  const signInTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initAppKit();
  }, []);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/explore");
    }
  }, [isAuthenticated, router]);

  // Track when wallet FIRST connects — but NOT if user already has a valid session
  // (they just disconnected intentionally, don't auto-resign)
  useEffect(() => {
    if (isConnected && !wasConnected.current && !isAuthenticated) {
      wasConnected.current = true;
      const timer = setTimeout(() => {
        if (!hasSignedIn.current && !isAuthenticated) {
          triggerSignIn();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // IMPORTANT: Do NOT reset wasConnected to false when disconnected.
    // Once the user has connected in this session, we don't auto-re-trigger.
    // They must click "Try Again" or reload to start a fresh sign-in.
  }, [isConnected, isAuthenticated]);

  const triggerSignIn = useCallback(async () => {
    if (!address || hasSignedIn.current || signingIn) return;

    hasSignedIn.current = true;
    setSigningIn(true);
    setError(null);

    const signInController = new AbortController();

    signInTimeout.current = setTimeout(() => {
      setError("Sign-in timed out. Please try again.");
      setSigningIn(false);
      hasSignedIn.current = false;
      signInController.abort();
    }, 10000);

    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        signal: signInController.signal,
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const message = `gofetch.app wants you to sign in with your Ethereum account:\n${address}\n\nSign in to GoFetch\n\nURI: https://gofetch.app\nVersion: 1\nChain ID: 84532\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      const signature = await signMessageAsync({ message });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
        signal: signInController.signal,
      });
      if (!verifyRes.ok) throw new Error("Verification failed");
      const { token, user } = await verifyRes.json();

      if (signInTimeout.current) clearTimeout(signInTimeout.current);
      dispatch(setCredentials({ user, token }));
      router.push("/app/explore");
    } catch (err) {
      if (signInTimeout.current) clearTimeout(signInTimeout.current);
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Sign-in failed");
      hasSignedIn.current = false;
      setSigningIn(false);
    }
  }, [address, signMessageAsync, dispatch, router, signingIn, isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (signInTimeout.current) clearTimeout(signInTimeout.current);
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
          {signingIn ? (
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setError(null);
                hasSignedIn.current = false;
                setSigningIn(false);
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
