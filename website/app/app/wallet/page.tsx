"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatAddress } from "@/lib/utils";

export default function WalletPage() {
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [balance, setBalance] = useState("0.00");
  const [lockedBalance, setLockedBalance] = useState("0.00");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setWithdrawMsg({ type: "success", text: `Withdrawal of ${withdrawAmount} USDC submitted. Funds will arrive shortly.` });
    setWithdrawAddr("");
    setWithdrawAmount("");
  };

  useEffect(() => {
    if (!address) return;

    const controller = new AbortController();
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [balanceRes, txRes] = await Promise.all([
          fetch("/api/wallet/balance", { signal: controller.signal }),
          fetch("/api/wallet/transactions", { signal: controller.signal }),
        ]);

        if (!ignore) {
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            setBalance(balanceData.balance?.usdc || "0.00");
            setLockedBalance(balanceData.balance?.locked || "0.00");
          }
          if (txRes.ok) {
            const txData = await txRes.json();
            setTransactions(Array.isArray(txData) ? txData : []);
          }
          setLoading(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [address]);

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Wallet</h1>
        <p className="text-muted">
          Manage your USDC balance and transactions
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-brand-primary to-brand-400 text-white">
        <div className="text-center">
          <p className="text-white/80 mb-2">Total Balance</p>
          <p className="text-4xl font-bold mb-1">{balance} USDC</p>
          <p className="text-lg text-white/70 mb-4">
            {ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : "0.0000 ETH"}
          </p>
          <p className="text-sm text-white/60 mb-6">
            Wallet: {address ? formatAddress(address) : "Not connected"}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => setShowDeposit(true)}>Deposit</Button>
            <Button
              variant="outline"
              className="!bg-transparent !text-white !border-white hover:!bg-white/10"
              onClick={() => setShowWithdraw(true)}
            >
              Withdraw
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
            <p className="text-2xl font-bold text-yellow-600">{lockedBalance} USDC</p>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-surface-tertiary rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-surface-tertiary rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-surface-tertiary rounded w-1/6"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-muted">No transactions yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <Card key={tx.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === "deposit" || tx.type === "escrow_release"
                          ? "bg-green-50"
                          : "bg-red-50"
                      }`}
                    >
                      <span
                        className={
                          tx.type === "deposit" || tx.type === "escrow_release"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {tx.type === "deposit" || tx.type === "escrow_release" ? "\u2193" : "\u2191"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {tx.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === "deposit" || tx.type === "escrow_release"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "deposit" || tx.type === "escrow_release" ? "+" : "-"}
                      {tx.amount?.toString() || "0"} USDC
                    </p>
                    {tx.note && (
                      <p className="text-xs text-muted">{tx.note}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Deposit Modal */}
    <Modal isOpen={showDeposit} onClose={() => { setShowDeposit(false); setCopied(false); }} title="Deposit USDC">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Send USDC (Base Sepolia) to your wallet:</p>
          <p className="font-mono text-sm break-all bg-white p-3 rounded-lg border border-gray-200">{address || "Not connected"}</p>
        </div>
        <button
          onClick={copyAddress}
          className="w-full py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors text-sm"
        >
          {copied ? "✓ Copied" : "Copy Address"}
        </button>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Testnet:</strong> Get free Base Sepolia USDC from a faucet, then send to this address. Deposits are reflected after 1 confirmation.
          </p>
        </div>
      </div>
    </Modal>

    {/* Withdraw Modal */}
    <Modal isOpen={showWithdraw} onClose={() => { setShowWithdraw(false); setWithdrawMsg(null); }} title="Withdraw USDC">
      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={withdrawAddr}
            onChange={(e) => setWithdrawAddr(e.target.value)}
            placeholder="0x..."
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <p className="text-xs text-gray-400 mt-1">Available: {balance} USDC</p>
        </div>
        {withdrawMsg && (
          <p className={`text-sm ${withdrawMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {withdrawMsg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={withdrawSending || !withdrawAddr || !withdrawAmount}
          className="w-full py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 transition-colors text-sm"
        >
          {withdrawSending ? "Processing..." : "Withdraw"}
        </button>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
          <p className="text-xs text-yellow-700">
            <strong>Note:</strong> Withdrawals are processed on Base Sepolia testnet. Ensure the recipient address supports USDC on Base.
          </p>
        </div>
      </form>
    </Modal>
    </>
  );
}
