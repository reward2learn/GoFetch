/**
 * Admin utilities — checks wallet against ADMIN_WALLETS env var.
 * Admin wallets are comma-separated checksummed addresses.
 */

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || "")
  .split(",")
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase());
}
