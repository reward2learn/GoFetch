export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const ESCROW_ABI = [
  {
    inputs: [
      { name: "dealId", type: "bytes32" },
      { name: "itemPrice", type: "uint256" },
      { name: "reward", type: "uint256" },
    ],
    name: "createDeal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "dealId", type: "bytes32" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "dealId", type: "bytes32" }],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "dealId", type: "bytes32" }],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "dealId", type: "bytes32" },
      { name: "traveler", type: "address" },
    ],
    name: "setTraveler",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "dealId", type: "bytes32" }],
    name: "getDeal",
    outputs: [
      {
        components: [
          { name: "buyer", type: "address" },
          { name: "traveler", type: "address" },
          { name: "itemPrice", type: "uint256" },
          { name: "reward", type: "uint256" },
          { name: "stake", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "dealId", type: "bytes32" }],
    name: "getDealStatus",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "dealId", type: "bytes32" },
      { indexed: false, name: "buyer", type: "address" },
      { indexed: false, name: "itemPrice", type: "uint256" },
      { indexed: false, name: "reward", type: "uint256" },
    ],
    name: "DealCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "dealId", type: "bytes32" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "DealFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "dealId", type: "bytes32" },
      { indexed: false, name: "totalPayout", type: "uint256" },
    ],
    name: "DealReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "dealId", type: "bytes32" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "DealRefunded",
    type: "event",
  },
] as const;

export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
