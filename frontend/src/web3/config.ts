// TrustMule on-chain configuration (Base Sepolia testnet by default).
// These values come from EXPO_PUBLIC_* env vars so they can ship in the app bundle.
// The real escrow goes LIVE once EXPO_PUBLIC_ESCROW_ADDRESS is set (after you deploy
// contracts/USDCEscrow.sol) AND you build a native dev build (Reown AppKit is native-only).

export const CHAIN = {
  id: Number(process.env.EXPO_PUBLIC_CHAIN_ID || 84532),
  name: "Base Sepolia",
  rpcUrl: process.env.EXPO_PUBLIC_RPC_URL || "https://sepolia.base.org",
};

export const REOWN_PROJECT_ID = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || "";
export const USDC_ADDRESS = process.env.EXPO_PUBLIC_USDC_ADDRESS || "";
export const ESCROW_ADDRESS = process.env.EXPO_PUBLIC_ESCROW_ADDRESS || "";

// USDC uses 6 decimals. 1.00 USDC = 1_000_000 base units.
export const USDC_DECIMALS = 6;
export function toUsdcUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}
export function fromUsdcUnits(units: bigint): number {
  return Number(units) / 10 ** USDC_DECIMALS;
}

// True only when a deployed escrow address is configured. Until then the app uses
// the managed escrow engine on the backend (fully testable in Expo Go).
export const ONCHAIN_LIVE = ESCROW_ADDRESS.trim().length > 0;
