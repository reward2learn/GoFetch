// TrustMule — Reown AppKit provider (NATIVE DEV BUILD ONLY).
//
// This file is intentionally NOT imported by app/_layout.tsx in the Expo Go / web preview,
// because @reown/appkit-react-native ships native modules that are absent from Expo Go and
// would crash the bundle. Wire it in ONLY after following WEB3_SETUP.md and generating a
// native build. See that doc for install + activation steps.
//
// Usage in app/_layout.tsx (native build):
//   import { Web3Provider } from "@/src/web3/AppKitProvider";
//   ...wrap the tree: <Web3Provider>{children}</Web3Provider>

import "@walletconnect/react-native-compat";
import React from "react";
import { createAppKit } from "@reown/appkit-react-native";
import { WagmiAdapter } from "@reown/appkit-wagmi-react-native";
import { AppKit, AppKitProvider } from "@reown/appkit-react-native";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { REOWN_PROJECT_ID } from "./config";

const networks = [baseSepolia] as const;

const wagmiAdapter = new WagmiAdapter({
  projectId: REOWN_PROJECT_ID,
  networks: [...networks],
});

const appKit = createAppKit({
  projectId: REOWN_PROJECT_ID,
  networks: [...networks],
  adapters: [wagmiAdapter],
  defaultNetwork: baseSepolia,
  metadata: {
    name: "TrustMule",
    description: "P2P crowdshipping with USDC escrow",
    url: "https://trustmule.app",
    icons: ["https://trustmule.app/icon.png"],
    redirect: { native: "frontend://" },
  },
  features: { email: true, socials: ["google"], showWallets: true },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <AppKitProvider instance={appKit}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
          <AppKit />
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  );
}
