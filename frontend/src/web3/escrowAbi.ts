// ABIs for the TrustMule USDC escrow (contracts/USDCEscrow.sol) and ERC-20 USDC.
// Consumed by wagmi/viem in the native dev build. Plain JS objects — safe to import anywhere.

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export const escrowAbi = [
  { type: "function", name: "createDeal", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }, { name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },
  { type: "function", name: "release", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },
  { type: "function", name: "refund", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },
  {
    type: "function", name: "getDeal", stateMutability: "view", inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "depositor", type: "address" }, { name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" },
      { name: "deposited", type: "bool" }, { name: "released", type: "bool" }, { name: "refunded", type: "bool" },
    ] }],
  },
] as const;
