"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { TenantProvider } from "../components/providers/TenantProvider";
import { BrandProvider } from "../components/providers/BrandProvider";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../lib/web3/appkit-provider";
import "../lib/web3/appkit-provider"; // Initialize AppKit

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const config = wagmiConfig as any;

  return (
    <ThemeProvider>
      <Provider store={store}>
        <BrandProvider>
          {config ? (
            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                <TenantProvider>{children}</TenantProvider>
              </QueryClientProvider>
            </WagmiProvider>
          ) : (
            <TenantProvider>{children}</TenantProvider>
          )}
        </BrandProvider>
      </Provider>
    </ThemeProvider>
  );
}
