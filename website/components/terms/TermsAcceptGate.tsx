"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/slices/auth.slice";
import { Button } from "@/components/ui/Button";

export default function TermsAcceptGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user has accepted, render children
  if (user?.acceptedTermsAt) {
    return <>{children}</>;
  }

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/accept-terms", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to save terms acceptance");
      }
      const data = await res.json();
      // Use the server-confirmed timestamp
      dispatch(setUser({ ...user!, acceptedTermsAt: data.acceptedAt }));
    } catch (err) {
      setError("Failed to save acceptance. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-surface-0/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-surface-1 rounded-2xl border border-border p-8 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-primary mb-2">
            Welcome to GoFetch
          </h2>
          <p className="text-muted mb-6">
            Please review and accept our Terms of Service and Privacy Policy to
            continue.
          </p>

          {/* Links to terms and privacy */}
          <div className="flex gap-4 mb-6">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-color underline text-sm"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-color underline text-sm"
            >
              Privacy Policy
            </a>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-[var(--light--app-primary,#2563eb)]"
            />
            <span className="text-sm text-secondary">
              I have read and agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          {/* Error */}
          {error && <p className="text-sm text-error mb-4">{error}</p>}

          {/* Button */}
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full"
          >
            {loading ? "Accepting..." : "Accept & Continue"}
          </Button>
        </div>
      </div>
      {children}
    </>
  );
}
