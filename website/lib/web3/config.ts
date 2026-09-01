"use client";

import { baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

let _appKit: any = null;
let _ready = false;

/**
 * Whether the Reown Project ID is configured (not empty/placeholder).
 */
export function isReownConfigured(): boolean {
  return !!projectId && projectId !== "your-reown-project-id" && projectId.length >= 20;
}

/**
 * Initialize Reown AppKit. Safe to call multiple times — only runs once.
 * Returns true when AppKit is ready for useAppKit() hook.
 * Only succeeds when a valid projectId is configured.
 */
export function initAppKit(): boolean {
  if (_ready) return true;
  if (typeof window === "undefined") return false;
  if (!isReownConfigured()) return false;

  try {
    const { createAppKit } = require("@reown/appkit");
    const { wagmiAdapter } = require("./wagmi-adapter");

    _appKit = createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks: [baseSepolia],
      metadata: {
        name: "GoFetch",
        description: "Global Shopping & Delivery Platform",
        url: window.location.origin,
        icons: ["https://gofetch.app/logo.png"],
      },
      features: {
        analytics: false,
        email: true,
        socials: ["google", "apple"],
      },
      enableAnalytics: false,
    });
    _ready = true;
  } catch (e) {
    console.warn("[GoFetch] AppKit init error:", e);
  }

  return _ready;
}

export function getAppKit() {
  return _appKit;
}

export function isAppKitReady() {
  return _ready;
}
