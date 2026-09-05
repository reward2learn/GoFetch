"use client";

import { useState } from "react";

interface StripeCheckoutButtonProps {
  orderId: string;
  totalAmount: number;
  disabled?: boolean;
  className?: string;
}

export default function StripeCheckoutButton({
  orderId,
  totalAmount,
  disabled = false,
  className = "",
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`w-full px-6 py-3 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${className}`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
            Fund with Card — ${totalAmount.toFixed(2)}
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-error text-center">{error}</p>
      )}
    </div>
  );
}
