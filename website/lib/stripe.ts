import Stripe from "stripe";

/**
 * Server-only Stripe client.
 *
 * Keys are provisioned via:
 * - Vercel Marketplace "Install Stripe" OAuth (preferred)
 * - Manual env var push: STRIPE_SECRET_KEY (+ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
 */
const secretKey =
  process.env.STRIPE_SECRET_KEY
  ?? process.env.STRIPE_API_KEY
  ?? "";

if (!secretKey && process.env.NODE_ENV !== "production") {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Install Stripe from the Vercel Marketplace "
    + "or add STRIPE_SECRET_KEY to .env.local"
  );
}

export const stripe = new Stripe(secretKey || "sk_test_placeholder", {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});

// Platform fee percentage (e.g., 10 = 10%)
export const PLATFORM_FEE_PCT = 10;

// Calculate platform fee in smallest currency unit
export function calcPlatformFee(amountInSmallestUnit: number, currency: string): number {
  // IDR has no decimals (smallest unit = 1 IDR)
  // USD has 2 decimals (smallest unit = 1 cent)
  return Math.round((amountInSmallestUnit * PLATFORM_FEE_PCT) / 100);
}
