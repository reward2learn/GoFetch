"use client";

import { ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { projectId, isReownConfigured } from "./config";
import { CHAIN_ID } from "@/lib/chain";

// Only create adapter if projectId is valid
const wagmiAdapter = isReownConfigured()
  ? new WagmiAdapter({
      networks: [sepolia],
      projectId,
      transports: {
        [sepolia.id]: http(),
      },
    })
  : null;

// Create AppKit instance with SIWE config
if (isReownConfigured() && wagmiAdapter) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [sepolia],
    metadata: {
      name: "GoFetch",
      description: "Global Shopping & Delivery Platform",
      url: typeof window !== "undefined" ? window.location.origin : "https://gofetch.app",
      icons: ["https://gofetch.app/logo.png"],
    },
    features: {
      analytics: false,
      email: true,
      socials: ["google", "apple"],
      emailShowWallets: true,
    },
    allWallets: "SHOW",
  });
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  // If Reown is not configured, just render children without AppKit
  if (!isReownConfigured() || !wagmiAdapter) {
    return <>{children}</>;
  }

  // The createAppKit() call above registers the context globally
  // We just need to ensure the children are rendered
  return <>{children}</>;
}

// Export wagmi config for the Web3Provider
export const wagmiConfig = wagmiAdapter?.wagmiConfig;
