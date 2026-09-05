"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface BrandSettings {
  logo: string | null;
  name: string;
  subtitle: string;
  favicon: string | null;
  loadingGraphic: string | null;
  loginTagline: string;
  loginSubtitle: string;
  poweredBy: string;
}

const defaultBrand: BrandSettings = {
  logo: null,
  name: "GoFetch",
  subtitle: "Global Delivery",
  favicon: null,
  loadingGraphic: null,
  loginTagline: "P2P Global Shopping & Delivery",
  loginSubtitle: "Connect your wallet to start buying or delivering items worldwide.",
  poweredBy: "Powered by USDC on Base Sepolia",
};

const BrandContext = createContext<BrandSettings>(defaultBrand);

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch("/api/admin/brand");
        if (res.ok) {
          const data = await res.json();
          setBrand({
            logo: data.logo || null,
            name: data.name || "GoFetch",
            subtitle: data.subtitle || "Global Delivery",
            favicon: data.favicon || null,
            loadingGraphic: data.loadingGraphic || null,
            loginTagline: data.loginTagline || "P2P Global Shopping & Delivery",
            loginSubtitle: data.loginSubtitle || "Connect your wallet to start buying or delivering items worldwide.",
            poweredBy: data.poweredBy || "Powered by USDC on Sepolia",
          });
        }
      } catch {
        // Use defaults
      }
    };

    fetchBrand();
  }, []);

  // Update favicon dynamically
  useEffect(() => {
    if (brand.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = brand.favicon;
    }
  }, [brand.favicon]);

  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  );
}
