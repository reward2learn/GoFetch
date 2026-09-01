"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { Web3Provider } from "../lib/web3/provider";
import { TenantProvider } from "../components/providers/TenantProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <Web3Provider>
        <TenantProvider>{children}</TenantProvider>
      </Web3Provider>
    </Provider>
  );
}
