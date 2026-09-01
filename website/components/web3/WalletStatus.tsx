"use client";

import { useAccount, useBalance } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function WalletStatus() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return (
      <Card className="bg-surface-tertiary">
        <p className="text-center text-muted">Wallet not connected</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted">Status</span>
          <Badge variant="success">Connected</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Address</span>
          <span className="font-mono text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Network</span>
          <span>{chain?.name || "Unknown"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">Balance</span>
          <span className="font-semibold">
            {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "0.00 USDC"}
          </span>
        </div>
      </div>
    </Card>
  );
}
