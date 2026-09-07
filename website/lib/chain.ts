/**
 * Single source of truth for the active blockchain network.
 * All chain IDs, names, and configuration derive from NEXT_PUBLIC_CHAIN_ID.
 */

const rawChainId = process.env.NEXT_PUBLIC_CHAIN_ID || "11155111";
export const CHAIN_ID = parseInt(rawChainId, 10);

export const CHAIN_NAME = (() => {
  switch (CHAIN_ID) {
    case 11155111: return "Sepolia";
    default: return `Chain ${CHAIN_ID}`;
  }
})();

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238") as `0x${string}`;

export const CHAIN_ID_STR = String(CHAIN_ID);

export const RPC_URLS: Record<number, { default: { http: string[] }; public: { http: string[] } }> = {
  11155111: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
    public: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
};

/** Get the RPC URL for the active chain */
export function getRpcUrl(): string {
  return RPC_URLS[CHAIN_ID]?.default.http[0] || RPC_URLS[11155111].default.http[0];
}

/** Check if the active chain is Sepolia (11155111) */
export function isSepolia(): boolean {
  return CHAIN_ID === 11155111;
}
