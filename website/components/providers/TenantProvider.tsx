"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  TenantConfig,
  getTenantConfig,
} from "@/domain/tenant/tenant-config";

interface TenantContextType {
  config: TenantConfig | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  config: null,
  loading: true,
  error: null,
});

export function useTenant() {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const tenantConfig = await getTenantConfig();
        setConfig(tenantConfig);

        // Apply tenant brand colors to CSS variables
        if (tenantConfig) {
          document.documentElement.style.setProperty(
            "--brand-primary",
            tenantConfig.primaryColor
          );
          document.documentElement.style.setProperty(
            "--secondary-primary",
            tenantConfig.secondaryColor
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load tenant config"
        );
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return (
    <TenantContext.Provider value={{ config, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}
