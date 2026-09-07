"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { TenantProvider } from "../components/providers/TenantProvider";
import { BrandProvider } from "../components/providers/BrandProvider";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../lib/web3/appkit-provider";
import "../lib/web3/appkit-provider"; // Initialize AppKit

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const config = wagmiConfig as any;

  // If no config is available, create a minimal fallback so WagmiProvider
  // is always rendered and useConfig/useAccount calls don't crash
  const wagmiConfigValue = config || {
    chains: [sepolia],
    transports: { [sepolia.id]: http() },
  };

  return (
    <ThemeProvider>
      <Provider store={store}>
        <BrandProvider>
          <WagmiProvider config={wagmiConfigValue}>
            <QueryClientProvider client={queryClient}>
              <TenantProvider>{children}</TenantProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </BrandProvider>
      </Provider>
    </ThemeProvider>
  );
}
