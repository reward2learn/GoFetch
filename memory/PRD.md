# TrustMule — PRD

## Original problem statement
A Web3-powered P2P crowdsourced shopping & delivery marketplace. Buyers post shopping
requests for items only available abroad; travellers flying from that country accept,
buy the item, and hand it over on arrival. Trust is guaranteed by a smart-contract USDC
escrow: buyer funds (item price + service fee) are locked and only released to the
traveller when the buyer confirms the handoff. Includes dual-deposit staking, KYC,
on-chain reputation, in-app chat with photo/receipt proof, cryptographic QR handoff,
and dispute/arbitration.

## User choices
- Full journey (post → accept → escrow → chat → confirm → payout)
- Real crypto: Reown AppKit Google social-wallet + on-chain USDC smart contract, targeting
  Base Sepolia. HYBRID delivery: preview uses a managed escrow engine (backend) that is
  fully testable in Expo Go; the real on-chain layer is wired to activate in a native build.
- Reown Project ID: 621b8dd9dc79db93bc918431c10c1764
- Real-time chat: yes. Design: agent's choice (iOS-Native Clean, Sage green + terracotta, light).

## Architecture
- Frontend: Expo Router (React Native). Tabs: Explore, Orders, Wallet, Profile. Stack modals:
  post, request/[id], order/[id], chat/[id], qr/[id], scan/[id], kyc, dispute/[id], review/[id].
- Backend: FastAPI + MongoDB (motor). Passwordless auth (bearer token per user). Managed
  escrow state machine + wallet ledger + transactions.
- Storage: Emergent Object Storage for images (product, receipt, chat, evidence).
- Web3 (ready-to-activate): /app/contracts/USDCEscrow.sol, /app/frontend/src/web3/* ,
  /app/WEB3_SETUP.md. Activates when EXPO_PUBLIC_ESCROW_ADDRESS is set + native build.

## Personas
- Buyer: needs an item from abroad, wants guaranteed delivery or refund.
- Traveller: monetises spare luggage; stakes collateral to prove commitment.

## Core requirements (static)
- Escrow lock/release, dual-deposit staking (15%), 3% platform fee, QR handoff, KYC,
  reputation/reviews, disputes, chat, wallet with USDC balance + tx history.

## Implemented (2026-08-29)
- Auth + wallet + KYC; Explore feed with filters/search/destination; post request (with
  image upload); request detail + offer/accept; order lifecycle timeline with role-based
  actions (stake, fund, purchased+receipt, transit, arrived, QR handoff, complete/confirm,
  cancel with slashing); chat (polling) with image attach; QR show + scan (camera + manual);
  disputes; reviews + on-chain-style reputation; wallet balance/locked/tx + faucet deposit.
- Web3 layer scaffolded (Solidity escrow, ABIs, Reown provider, setup guide).
- Verified: 35/35 backend E2E tests pass; full money-flow correct.

## Implemented (2026-08-30) — Locations & Travel plans
- Expanded location dataset: countries → international-airport cities (incl. Indonesia
  with Denpasar (Bali)); reusable two-step country→city LocationPicker.
- Requests now carry fromCity + toCity; post form + request detail show full routes.
- Travel plans: members post future trips (from/to country+city, depart date).
- Matching Inbox: open requests on a member's trip route auto-appear in their inbox
  (new Trips tab: Inbox + My Trips). Plan cards show matchCount.
- Delivery availability: "N travellers can deliver this" (planned trips + past deliveries)
  shown on the post form and request detail.
- Public member profiles (/user/[id]) surfacing the 5-star rating + reviews; buyer &
  counterparty cards link to them. Wallet moved behind an Explore header chip (4 tabs).
- Verified: 16/16 new backend tests pass; all new frontend flows pass.

## Backlog / remaining
- P1: Activate real on-chain layer (deploy contract, native build, Reown wallet connect).
- P1: Negotiation counter-offers; order push/real-time via websockets.
- P2: Arbitration resolution UI for moderators; micro-insurance pool; FX price oracle;
  proof-of-personhood / on-chain attestations (EAS/SBT).
- P2: Split server.py into routers; Pydantic v2 model_dump; FastAPI lifespan.
