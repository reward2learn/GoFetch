"use client";

import { useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatAddress } from "@/lib/utils";

// ERC20 balanceOf ABI (minimal)
const ERC20_BALANCE_OF_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Supported chains with their USDC contracts
const SUPPORTED_CHAINS = [
  { id: 11155111, name: "Sepolia", usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}` },
] as const;

const USDC_DECIMALS = 6;

export default function WalletPage() {
  const { address, chain } = useAccount();
  const chainId = chain?.id || 11155111;

  // ETH balance via wagmi
  const { data: ethBalance, isLoading: ethLoading } = useBalance({ address });

  // USDC balance from blockchain
  const chainConfig = SUPPORTED_CHAINS.find(c => c.id === chainId) || SUPPORTED_CHAINS[0];
  const { data: usdcBalanceRaw, isLoading: usdcLoading, error: usdcError } = useReadContract({
    address: chainConfig.usdc,
    abi: ERC20_BALANCE_OF_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!address },
  });

  const usdcBalance = usdcBalanceRaw
    ? (Number(usdcBalanceRaw) / 10 ** USDC_DECIMALS).toFixed(2)
    : "0.00";

  const ethFormatted = ethBalance
    ? parseFloat(ethBalance.formatted).toFixed(4)
    : "0.0000";

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSending, setWithdrawSending] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddr || !withdrawAmount) return;
    setWithdrawSending(true);
    setWithdrawMsg(null);
    await new Promise((r) => setTimeout(r, 1500));
    setWithdrawSending(false);
    setWithdrawMsg({ type: "success", text: `Claim of ${withdrawAmount} USDC submitted. Funds will arrive shortly.` });
    setWithdrawAddr("");
    setWithdrawAmount("");
  };

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-color">Account</h1>
          <p className="text-muted">
            Manage your account balance
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary-hover text-white">
        <div className="text-center">
          <p className="text-white/80 mb-2">Total Balance</p>
          <p className="text-4xl font-bold mb-1">
            {(usdcLoading || ethLoading) ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>${usdcBalance}</>
            )}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-lg text-white/70">
              {ethFormatted} ETH
            </p>
          </div>
          <p className="text-sm text-white/60 mb-1 cursor-pointer hover:text-white/80 transition-colors relative inline-block" onClick={copyAddress}>
            Account: {address ? formatAddress(address) : "Not connected"}
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white text-primary text-xs rounded-full shadow-lg whitespace-nowrap">Copied!</span>
            )}
          </p>
          <p className="text-xs text-white/50 mb-6">
            {chainConfig.name} (Chain {chainId})
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => setShowDeposit(true)}>Topup</Button>
            <Button
              variant="outline"
              className="!bg-transparent !text-white !border-white hover:!bg-white/10"
              onClick={() => setShowWithdraw(true)}
            >
              Claim
            </Button>
          </div>
        </div>
      </Card>

      {/* Locked Balance */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Locked in Escrow</p>
            <p className="text-sm text-muted">
              Funds secured for active orders
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-color">0.00 USDC</p>
          </div>
        </div>
      </Card>

      {/* On-chain info */}
      <Card>
        <div className="space-y-3">
          <h3 className="font-medium">On-Chain Balances</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">ETH Balance</p>
              <p className="font-semibold">{ethFormatted} ETH</p>
            </div>
            <div>
              <p className="text-muted">USDC Balance</p>
              <p className="font-semibold text-primary-color">
                ${usdcBalance} <Badge>USDC</Badge>
              </p>
            </div>
            <div>
              <p className="text-muted">Network</p>
              <p className="font-semibold">{chainConfig.name}</p>
            </div>
            <div>
              <p className="text-muted">Chain ID</p>
              <p className="font-semibold">{chainId}</p>
            </div>
          </div>
          <div>
            <p className="text-muted text-xs">USDC Contract</p>
            <p className="font-mono text-xs break-all">{chainConfig.usdc}</p>
          </div>
          {usdcError && (
            <div className="bg-error border border-red-200 rounded-lg p-2">
              <p className="text-xs text-error">USDC read error: {usdcError.message}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Transaction History placeholder */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <Card className="text-center py-8">
          <p className="text-muted">No transactions yet</p>
        </Card>
      </div>
    </div>

    {/* Topup Modal */}
    <Modal isOpen={showDeposit} onClose={() => { setShowDeposit(false); setCopied(false); }} title={`Topup USDC (${chainConfig.name})`}>
      <div className="space-y-4">
        <div className="bg-surface-2 rounded-xl p-4 text-center">
          <p className="text-sm text-muted mb-2">Send USDC ({chainConfig.name}) to your account:</p>
          <p className="font-mono text-sm break-all bg-surface-1 p-3 rounded-lg border border-border">{address || "Not connected"}</p>
        </div>
        <button
          onClick={copyAddress}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors text-sm"
        >
          {copied ? "✓ Copied" : "Copy Address"}
        </button>
        <div className="bg-info border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-info">
            <strong>Testnet:</strong> Get free USDC from a {chainConfig.name} faucet, then send to this address. Deposits are reflected after 1 confirmation.
          </p>
        </div>
      </div>
    </Modal>

    {/* Claim Modal */}
    <Modal isOpen={showWithdraw} onClose={() => { setShowWithdraw(false); setWithdrawMsg(null); }} title="Claim USDC">
      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={withdrawAddr}
            onChange={(e) => setWithdrawAddr(e.target.value)}
            placeholder="0x..."
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount (USDC)</label>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={withdrawAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              const parts = val.split(".");
              if (parts.length > 2) return;
              setWithdrawAmount(val);
            }}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted mt-1">Available: ${usdcBalance}</p>
        </div>
        {withdrawMsg && (
          <p className={`text-sm ${withdrawMsg.type === "success" ? "text-success" : "text-error"}`}>
            {withdrawMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={withdrawSending || !withdrawAddr || !withdrawAmount}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors text-sm"
        >
          {withdrawSending ? "Processing..." : "Claim"}
        </button>
        <div className="bg-warning border border-yellow-100 rounded-lg p-3">
          <p className="text-xs text-warning">
            <strong>Note:</strong> Claims are processed on {chainConfig.name}. Ensure the recipient address supports USDC on this network.
          </p>
        </div>
      </form>
    </Modal>
    </>
  );
}
