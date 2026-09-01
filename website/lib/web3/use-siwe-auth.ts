"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/auth.slice";

export function useSiweAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useAppKit();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      await open();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      // 2. Create SIWE message
      const message = `gofetch.app wants you to sign in with your Ethereum account:
${address}

Sign in to GoFetch

URI: https://gofetch.app
Version: 1
Chain ID: 84532
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      // 3. Sign message
      const signature = await signMessageAsync({ message });

      // 4. Verify with server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      if (!verifyRes.ok) throw new Error("Verification failed");
      const { token, user } = await verifyRes.json();

      // 5. Store credentials in Redux
      dispatch(setCredentials({ user, token }));

      // 6. Redirect to dashboard
      router.push("/app/explore");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, signMessageAsync, open, router, dispatch]);

  return { signIn, loading, error };
}
