"use client";

import { useAppDispatch } from "@/redux/hooks";
import { setConnectDropdownOpen } from "@/redux/slices/web3.slice";
import { Button } from "@/components/ui/Button";
import { getAppKit } from "@/lib/web3/config";

/**
 * AppKitConnectButton — opens the Reown AppKit wallet modal.
 * Uses the vanilla getAppKit() API instead of the useAppKit() React hook
 * to avoid requiring the AppKit React context provider.
 */
export function AppKitConnectButton() {
  const dispatch = useAppDispatch();

  const handleOpen = () => {
    dispatch(setConnectDropdownOpen(true));
    const appKit = getAppKit();
    if (appKit && typeof appKit.open === "function") {
      appKit.open();
    } else {
      console.warn("[GoFetch] AppKit not initialized — cannot open modal");
    }
  };

  return (
    <Button variant="primary" onClick={handleOpen}>
      Connect Wallet
    </Button>
  );
}
