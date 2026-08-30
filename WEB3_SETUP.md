# TrustMule — Going Live On-Chain (Base Sepolia → Mainnet)

The app ships with a **managed escrow engine** on the backend so the full journey
(post → accept → stake → fund → purchase → transit → arrive → QR handoff → payout)
is testable **today in Expo Go**. This document is the checklist to switch the money
layer to a **real USDC smart contract** using **Reown AppKit** wallets.

> ⚠️ Reown AppKit and on-chain calls are **native-only**. They do NOT run in Expo Go or the
> web preview — you must generate a **native dev/production build** (Publish button) to use them.

## 1. Deploy the escrow contract (`/app/contracts/USDCEscrow.sol`)

Using Foundry with a dedicated **testnet** deployer key:

```bash
forge init contracts && cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
# copy USDCEscrow.sol into src/

export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=0xYOUR_DEDICATED_TESTNET_KEY
export ARBITER=0xYourPlatformArbiterAddress
export USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e   # Base Sepolia USDC

forge create src/USDCEscrow.sol:USDCescrow \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" \
  --constructor-args "$USDC" "$ARBITER" --broadcast
```

Copy the deployed address.

## 2. Set the addresses

- `frontend/.env` → `EXPO_PUBLIC_ESCROW_ADDRESS=0x...`
- `backend/.env`  → `ESCROW_ADDRESS=0x...`

When `EXPO_PUBLIC_ESCROW_ADDRESS` is set, `src/web3/config.ts` flips `ONCHAIN_LIVE = true`.

## 3. Install native Web3 deps (native build only)

```bash
cd frontend
npx expo install @reown/appkit-react-native @reown/appkit-wagmi-react-native \
  @walletconnect/react-native-compat react-native-get-random-values \
  @react-native-community/netinfo wagmi viem @tanstack/react-query
```

Then wire `src/web3/AppKitProvider.tsx` (already scaffolded) into `app/_layout.tsx`,
wrapping the tree with `AppKitProvider` + `WagmiProvider` + `QueryClientProvider`, and
render `<AppKit />` once near the root. Reown Project ID is already in `.env`:
`EXPO_PUBLIC_REOWN_PROJECT_ID`.

## 4. Register identifiers in Reown Dashboard

Add the app's bundle id / package (`com.emergent.trustmule.eg82zz`) and the deep-link
scheme (`frontend://`) at https://dashboard.reown.com.

## 5. On-chain order flow mapping

| App action            | On-chain call                                  |
|-----------------------|------------------------------------------------|
| Buyer funds escrow    | `USDC.approve(escrow, total)` → `createDeal` → `deposit` |
| QR handoff completes  | `release(id)` (depositor or arbiter)           |
| Dispute → refund      | `refund(id)` (arbiter multisig)                |

Use `keccak256` of the backend order id as the on-chain `bytes32` deal id.

## 6. Testnet funds

Get Base Sepolia ETH + test USDC from Base/Circle faucets, then run the full flow with
two devices (buyer + traveler).

**Never** put the deployer/arbiter private key in the app or `EXPO_PUBLIC_*` vars.
