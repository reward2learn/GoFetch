# TrustMule — Comprehensive Architecture & UX/UI Analysis

**Document Date:** 2026-08-30  
**Current Tech Stack:** Expo/React Native (Frontend) + FastAPI/Python (Backend) + MongoDB (Database)  
**Target Tech Stack:** Next.js/TypeScript + Neon Database + Redux

---

## Table of Contents

1. [Executive Summary] (#executive-summary)
2. [Application Overview] (#application-overview)
3. [Core Use Cases & User Journeys] (#core-use-cases--user-journeys)
4. [Frontend Architecture] (#frontend-architecture)
5. [Backend Architecture] (#backend-architecture)
6. [Database Schema] (#database-schema)
7. [Navigation & Screen Flow] (#navigation--screen-flow)
8. [UX/UI Design System] (#uxui-design-system)
9. [Component Hierarchy] (#component-hierarchy)
10. [State Management] (#state-management)
11. [Web3 Integration] (#web3-integration)
12. [Migration Strategy to Next.js] (#migration-strategy-to-nextjs)

---

## Executive Summary

**TrustMule** is a peer-to-peer marketplace for global shopping & delivery powered by blockchain escrow. The current implementation is built on:

- **Frontend:** Expo (React Native) with file-based routing via expo-router
- **Backend:** FastAPI (Python) with MongoDB
- **Storage:** Emergent Object Storage API (cloud-hosted)
- **Web3:** Solidity escrow contract (Base Sepolia, ready to activate)

The app orchestrates a complete journey: buyer posts request → traveller accepts → mutual staking → escrow funding → purchase → in-transit with chat/photos → QR handoff → payout with reputation/reviews.

**Key Insight:** The app is built with Emergent framework (serverless/webhook-driven), which manages infrastructure, object storage, and observability. Migration to Next.js requires reimagining this coupled architecture.

---

## Application Overview

### Business Model

- **Buyers** post shopping requests for items from abroad
- **Travellers** monetize spare luggage by accepting requests
- **Escrow protects both:** USDC held in smart contract until handoff confirmed
- **Revenue:** 3% platform fee + reputation/KYC verification

### Personas

#### Primary Personas

1. **Buyer (Import-Minded)**
   - Needs an item from abroad (perfume, electronics, fashion)
   - Wants guaranteed delivery or refund
   - Creates request → funds escrow → tracks delivery → QR confirms handoff → rates traveller

2. **Traveller (Luggage Monetizer)**
   - Flying internationally with spare luggage capacity
   - Posts travel plan (from/to country+city, dates)
   - Gets matched with relevant requests → accepts → stakes collateral → buys → delivers → earns reward

#### Secondary Personas

1. **Arbitrator (Platform moderator)**
   - Resolves disputes via multi-sig wallet
   - Can refund in case of non-delivery

---

## Core Use Cases & User Journeys

### Use Case 1: Browse & Accept as Traveller

```code
Flow:
  1. Traveller opens Explore tab → sees 2-column grid of open requests
  2. Filters by category (Beauty, Electronics, Fashion, Other) or destination country
  3. Taps request card → sees RequestDetail:
     - Hero image with gradient scrim
     - Item name, price, traveller reward (prominent)
     - Origin & destination cities
     - Buyer trust score/reputation
     - "Delivery Availability" badge (N travellers can deliver)
     - "Accept & Escrow" button (sticky at bottom)
  4. Taps Accept → PaymentModal:
     - System calculates stake (15% of item price)
     - Traveller can propose service fee
     - Creates order in "offered" state
  5. Buyer sees offer in Orders tab
  6. Buyer accepts → order moves to "agreed" state
  7. Traveller stakes collateral from wallet
  8. Buyer funds escrow (item price + service fee + platform fee)
  9. Traveller receives "Purchased" push notification
  10. Traveller uploads receipt → in_transit state
  11. Traveller can chat & share photos with buyer
  12. Traveller arrives → "QR Handoff" state
  13. Traveller shows QR or manual handoff code
  14. Buyer scans or enters code → completes handoff
  15. Funds released to traveller → "completed" state
  16. Both rate each other
```code

**UX Touch Points:**

- Card-based marketplace discovery with instant filtering
- Sticky CTAs for action (Accept, Fund, Confirm)
- Real-time status timeline showing progress
- Photo uploads (receipt, QR) embedded in order flow
- In-app chat with image attachment

---

### Use Case 2: Post Request as Buyer

```code
Flow:
  1. Buyer taps "Trips" tab or floating action
  2. Enters PostRequest modal:
     - Item title & description
     - Category selector (Beauty, Electronics, Fashion, Other)
     - Photo upload (defaults to category image)
     - Origin country → city picker (2-step)
     - Destination country → city picker
     - Delivery deadline
     - Slider for traveller reward (USDC amount)
     - Shows "N travellers can deliver this" availability metric
     - "Fund Escrow & Post" button
  3. Buyer funds USDC escrow (item price + reward + platform fee)
  4. Request moves to "open" state
  5. Requests matching buyer's route auto-notify travellers on their Inbox
  6. Offers start appearing on RequestDetail
  7. Buyer reviews offers → accepts/rejects
  8. Once accepted, order enters escrow workflow
```code

**UX Touch Points:**

- Form validation with clear field labeling
- Category-driven image suggestions
- Real-time reward slider with fee breakdown
- Delivery availability indicator
- KeyboardAvoidingView with sticky fund button

---

### Use Case 3: Travel Plan & Inbox Matching

```code
Flow:
  1. Traveller taps "Trips" tab → My Trips subsection
  2. Enters TravelPlanCreate modal:
     - From country → city (2-step picker)
     - To country → city (2-step picker)
     - Depart date & return date
     - Cargo capacity (1–N items)
     - Optional note
     - "Post Trip" button
  3. Backend runs matching:
     - Finds all open requests on same route
     - Auto-notifies relevant buyers
  4. Traveller sees Inbox subsection (second tab in Trips)
     - Shows all requests on their active travel plans
     - Match count badge on each plan
  5. Traveller can tap request from Inbox → RequestDetail → Accept flow
```code

**UX Touch Points:**

- Dual-tab navigation within Trips (My Trips + Inbox)
- Route-based notification push
- Match count badges for social proof

---

### Use Case 4: Order Tracking & State Machine

```code
Order States (9-step timeline):
  offered          → Traveller proposes fee
  agreed           → Buyer accepts offer
  funded           → Buyer stakes collateral (locked visible in wallet)
  purchased        → Traveller uploads receipt (receipt hash)
  in_transit       → Traveller confirms purchase
  arrived          → Traveller arrives at destination
  handoff_pending  → Awaiting QR or manual code handoff
  completed        → Handoff confirmed; funds released
  [cancelled|disputed]  → Cancellation with slashing; or dispute escalation

UX Display:
  - Vertical stepper showing current step + previous steps
  - Step label + status badge
  - Timeline entry for each state transition
  - Sticky traveller contact card at bottom
    - Quick actions: Chat, Cancel, etc.
  - Role-based action buttons:
    - Buyer: Fund, Confirm Handoff, Review, Dispute
    - Traveller: Stake, Upload Receipt, Scan QR, Upload Evidence (dispute)
```code

**UX Touch Points:**

- Linear progress visualization (no back-steps)
- Clear role-based CTA differentiation
- Real-time chat integration
- QR/manual code flexibility

---

### Use Case 5: Wallet & Transactions

```code
Flow:
  1. Buyer/Traveller taps Wallet tab (hidden in navigation, accessible via header chip)
  2. Sees fintech-style card:
     - Large balance (USDC)
     - "Deposit" & "Withdraw" buttons
     - Faucet deposit for testnet
  3. Scrolls through transaction history:
     - Each tx shows: type, amount, status, date
     - Escrow-locked amounts shown with "Locked" badge (warning color)
     - Completed transfers show checkmark
  4. Deposit flow:
     - Enters amount
     - Approves transaction
     - Bridges to test USDC (or real USDC on mainnet)
  5. Withdraw flow:
     - Enters amount & destination
     - Confirms
     - Funds released from wallet
```code

**UX Touch Points:**

- Neobank-style balance display (premium feel)
- Transparent "Locked" status on escrowed funds
- Clear transaction type labels (Deposit, Locked, Released, Slashed)
- Testnet faucet for easy demo

---

### Use Case 6: Reputation & Reviews

```code
Flow:
  1. Order completes
  2. Both buyer & traveller see review prompt
  3. ReviewDetail modal:
     - 1–5 star picker
     - Comment text input (optional)
     - Submit button
  4. Reviews aggregate into user profile:
     - Average rating
     - Total reviews count
     - Reviewer avatars in list
  5. Public user profile (/user/[id]):
     - Avatar, name, bio
     - Reputation score (1–5)
     - Reviews count
     - Orders completed, trips completed
     - "Top Traveller" badge if (trips ≥ 3 AND reputation ≥ 4.7)
  6. Buyer & traveller cards throughout app link to profiles
```code

**UX Touch Points:**

- Star rating with instant feedback
- Profile link cards (buyer/traveller info cards)
- Reputation display as social proof

---

### Use Case 7: Disputes & Resolution

```code
Flow:
  1. Buyer or traveller taps "Dispute" during order
  2. DisputeDetail modal:
     - Reason text input
     - Evidence photo uploads (multiple)
     - Submit button
  3. Dispute status shown on order timeline
  4. Arbitrator (platform moderator, multisig wallet holder):
     - Reviews dispute & evidence
     - Decides: refund buyer OR release funds to traveller
     - Posts resolution
  5. Funds automatically released per decision
```code

**UX Touch Points:**

- Photo-based evidence submission
- Clear dispute reasoning input
- Transparent resolution display

---

### Use Case 8: QR Handoff & Crypto Security

```code
Flow:
  1. Traveller in "handoff_pending" state
  2. Taps "Scan QR" or "Show QR" FAB
  3. If showing QR:
     - Generates cryptographic secret → keccak256(secret + orderId)
     - Displays QR code (encodes handoff secret)
     - Also shows manual code (short alphanumeric fallback)
  4. Buyer scans QR:
     - Opens ScanDetail modal
     - Camera or manual text input
     - Verifies hash on backend
     - If match: releases escrow funds
  5. Both see "completed" state + celebration UI
```code

**UX Touch Points:**

- QR generation with fallback manual input
- Instant confirmation feedback
- End-to-end cryptographic assurance

---

## Frontend Architecture

### Directory Structure

```code
frontend/
├── app/                          # Expo Router file-based navigation
│   ├── _layout.tsx               # Root layout (GestureHandler, SafeArea, AuthProvider)
│   ├── +html.tsx                 # Web-only root
│   ├── login.tsx                 # Auth screen (modal)
│   ├── kyc.tsx                   # KYC verification (modal)
│   ├── post.tsx                  # Create request (modal)
│   ├── travel-plan.tsx           # Create travel plan (modal)
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx           # Tabs container
│   │   ├── explore.tsx           # Marketplace grid feed
│   │   ├── trips.tsx             # Travel plans + inbox
│   │   ├── orders.tsx            # My orders (buying + traveling)
│   │   ├── profile.tsx           # User profile + settings
│   │   └── wallet.tsx            # Wallet (moved to tab but hidden)
│   ├── request/
│   │   └── [id].tsx              # Request detail + accept flow
│   ├── order/
│   │   └── [id].tsx              # Order tracking + actions
│   ├── chat/
│   │   └── [id].tsx              # In-order messaging
│   ├── qr/
│   │   └── [id].tsx              # QR show/generation
│   ├── scan/
│   │   └── [id].tsx              # QR scan
│   ├── review/
│   │   └── [id].tsx              # Post-order rating
│   ├── dispute/
│   │   └── [id].tsx              # Dispute filing
│   └── user/
│       └── [id].tsx              # Public user profile
│
├── src/
│   ├── api/
│   │   └── client.ts             # Fetch-based HTTP client + auth header
│   ├── components/
│   │   ├── ui.tsx                # Reusable UI primitives (Button, Card, Badge, Avatar, etc.)
│   │   ├── LegalLayout.tsx       # Terms/Privacy wrapper
│   │   └── LocationPicker.tsx    # 2-step country→city selector
│   ├── context/
│   │   └── AuthContext.tsx       # Global user state + login/logout
│   ├── hooks/
│   │   ├── use-app-fonts.ts      # Plus Jakarta Sans loader
│   │   └── use-icon-fonts.ts     # Ionicons loader
│   ├── theme/
│   │   └── theme.ts              # Design tokens (colors, spacing, radius, typography)
│   ├── utils/
│   │   └── storage/
│   │       ├── index.ts          # Platform-agnostic storage interface
│   │       ├── index.web.ts      # Web-specific (localStorage)
│   │       └── storage-base.ts   # Shared logic
│   ├── web3/
│   │   ├── config.ts             # Escrow address + chain config
│   │   ├── AppKitProvider.tsx    # Reown AppKit wrapper (scaffolded)
│   │   └── escrowAbi.ts          # Smart contract ABI
│   ├── constants.ts              # App-wide constants (categories, countries)
│   └── locations.ts              # Country↔city mapping data
│
├── package.json                  # Expo + deps (React 19, React Native 0.81)
├── tsconfig.json                 # TypeScript config
├── metro.config.js               # Metro bundler setup
└── eslint.config.js              # Linting rules
```code

### Key Technologies

| Layer | Technology | Version | Purpose |
| ------- | ----------- | --------- | --------- |
| **Runtime** | Expo | 54.0.37 | Cross-platform dev & publishing |
| **Routing** | expo-router | 6.0.24 | File-based navigation (like Next.js) |
| **UI Framework** | React Native | 0.81.5 | Native mobile rendering |
| **State** | React Context | 19.1.0 | Global auth + user state |
| **HTTP** | fetch (native) | — | API communication |
| **Storage** | @react-native-async-storage | 2.2.0 | Persistent key-value store |
| **Secure Storage** | expo-secure-store | 15.0.8 | Token/secrets (encrypted) |
| **Image Display** | expo-image | 3.0.11 | Optimized image rendering |
| **Animations** | expo-linear-gradient | 15.0.8 | Gradient overlays |
| **Animations** | react-native-reanimated | 4.1.1 | Declarative animations |
| **Gestures** | react-native-gesture-handler | 2.28.0 | Touch handling + swipes |
| **Bottom Sheet** | @gorhom/bottom-sheet | 5.2.14 | Modal drawer UI |
| **QR Codes** | react-native-qrcode-svg | 6.3.21 | QR generation |
| **Camera** | expo-camera | ~17.0.10 | QR scanning |
| **Icons** | @expo/vector-icons | 15.1.1 | Ionicons set |
| **Date** | date-fns, dayjs | 4.1.0, 1.11.13 | Temporal utilities |
| **Language** | TypeScript | 5.9.3 | Type safety |

### Component Hierarchy

#### Screen Components (Pages)

- **Explore.tsx** — Marketplace grid with filters
  - State: `items[]`, `loading`, `refreshing`, `cat`, `dest`, `q`, `balance`, `unread`
  - Hooks: `useFocusEffect`, `useAuth`, `api.get(/requests, /wallet, /notifications/unread-count)`
  - Layout: Header (location selector, search bar, filter chips) + FlatList (2-column grid)

- **RequestDetail.tsx** — Product detail + accept offer
  - State: `request`, `offers[]`, `loading`
  - Hooks: `useFocusEffect`, `useRouter`, `api.get(/requests/[id])`
  - Layout: Hero image (with gradient scrim) + details card + offers section + sticky accept button

- **Orders.tsx** — My active orders (buying + traveling)
  - State: `orders[]`, `filter` (All|Buying|Traveling)
  - Hooks: `useFocusEffect`, `useAuth`, `api.get(/orders/mine)`
  - Layout: Header + filter segment + FlatList (order cards)

- **OrderDetail.tsx** — Order tracking + state-based actions
  - State: `order`, `loading`, `busy` (action in progress), `err`
  - Hooks: `useFocusEffect`, `useRouter`, `api.post(/orders/[id]/*, /orders/[id]/purchased, etc.)`
  - Layout: Hero (request image) + timeline (vertical stepper) + role-based CTAs (sticky) + traveller card

- **Chat.tsx** — In-order messaging
  - State: `messages[]`, `text`, `image`, `loading`
  - Hooks: `useFocusEffect`, `api.get(/orders/[id]/chat)`, polling for new messages
  - Layout: Header + scrolling message bubbles + input + image picker

- **Profile.tsx** — User profile + KYC + settings
  - State: `user`, `reviews[]`, `editing`, `form fields`
  - Hooks: `useAuth`, `api.patch(/users/me)`, `api.post(/users/kyc)`
  - Layout: Avatar + name/bio editor + reviews list + KYC button + logout

- **Trips.tsx** — Travel plans + inbox matching
  - State: `myPlans[]`, `inbox[]`, `activeTab` (My Trips | Inbox)
  - Hooks: `useFocusEffect`, `api.get(/travel-plans/mine)`, `api.get(/inbox)`
  - Layout: Dual-tab container + plan cards (with match count) + inbox request cards

#### Modal Components

- **post.tsx** — PostRequest form (item, images, origin, destination, reward, fund)
- **travel-plan.tsx** — TravelPlanCreate form (from/to country+city, dates, capacity)
- **kyc.tsx** — KYC submission form
- **qr/[id].tsx** — QR generation & display
- **scan/[id].tsx** — QR scanning & verification
- **review/[id].tsx** — Post-order review (rating + comment)
- **dispute/[id].tsx** — Dispute filing (reason + evidence photos)
- **user/[id].tsx** — Public profile (read-only)

#### Reusable Components (UI Primitives)

Defined in `src/components/ui.tsx`:

```codetypescript
// Text
<AppText weight="bold" size={24} color="#2A5A4A">Label</AppText>

// Button variants
<Button variant="primary" onPress={onPress} loading={busy} disabled={disabled} />
<Button variant="secondary" />
<Button variant="outline" />
<Button variant="ghost" />
<Button variant="danger" />

// Card
<Card style={styles}>Content</Card>

// Badge (status labels)
<Badge label="Buying" tone="brand" icon="bag-handle" />
<Badge label="In Transit" tone="success" />
<Badge label="Dispute" tone="error" />

// Avatar (initials + colorful background)
<Avatar name="John Doe" size={40} />

// EmptyState (icon + title + subtitle)
<EmptyState icon="cube-outline" title="No orders" subtitle="..." />

// Divider
<Divider />
```code

### State Management Approach

**Current Model:** React Context + useCallback hooks

```codetypescript
// AuthContext provides:
{
  user: User | null,
  loading: boolean,
  login(name, email, acceptedTerms): Promise<void>,
  logout(): Promise<void>,
  refresh(): Promise<void>,
  setUser(u: User): void
}
```code

**Per-Screen State:** useState + useFocusEffect for re-fetching on tab focus

```codetypescript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useFocusEffect(
  useCallback(() => {
    load(); // Refetch when screen comes into focus
  }, [])
);
```code

**API Client:** Fetch-based with auth header injection

```codetypescript
const api = {
  async get(path: string),
  async post(path: string, body?),
  async patch(path: string, body?),
  async uploadImage(uri: string)
}
```code

**Notable:** No Redux, Zustand, or Recoil. Pure React Context + local state.

---

## Backend Architecture

### Technology Stack

- **Framework:** FastAPI (Python async)
- **Database:** MongoDB (motor async driver)
- **Storage:** Emergent Object Storage API (cloud-hosted)
- **Deployment:** Emergent (serverless + webhooks)

### Directory Structure

```code
backend/
├── server.py                     # Monolithic FastAPI app (1000+ lines)
├── requirements.txt              # Python dependencies
├── pytest.ini                    # Test configuration
├── .env                          # Secrets & config (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, etc.)
└── tests/
    ├── test_trustmule_backend.py # 35 core E2E tests
    ├── test_travel_plans_and_matching.py
    └── test_iteration3_features.py
```code

### Architecture Overview

#### Global Dependencies

```codepython
# Storage (Emergent managed)
STORAGE_BASE = os.environ.get("INTEGRATION_PROXY_URL") → "https://integrations.emergentagent.com"
STORAGE_URL = f"{STORAGE_BASE}/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Database (MongoDB via motor)
mongo_url = os.environ["MONGO_URL"]
db = AsyncIOMotorClient(mongo_url)[os.environ["DB_NAME"]]

# App configuration
PLATFORM_FEE_PCT = 0.03      # 3% fee on every order
STAKE_PCT = 0.15             # Traveller stakes 15% of item price
STARTING_TEST_BALANCE = 0.0  # Test users start with $0
```code

#### Database Collections

| Collection | Key Fields | Purpose |
| ----------- | ----------- | --------- |
| **users** | `id`, `email`, `walletAddress`, `kycStatus`, `reputation`, `usdcBalance`, `lockedBalance`, `token` | User accounts + balances |
| **requests** | `id`, `buyerId`, `title`, `category`, `image`, `itemPrice`, `reward`, `fromCountry`, `toCountry`, `status` | Shopping requests (open/closed) |
| **orders** | `id`, `requestId`, `buyerId`, `travelerId`, `status`, `itemPrice`, `serviceFee`, `stake`, `timeline` | Order lifecycle + escrow state |
| **travel_plans** | `id`, `userId`, `fromCountry`, `toCountry`, `departDate`, `returnDate`, `status` | Traveller trip announcements |
| **chat_messages** | `id`, `orderId`, `senderId`, `text`, `imageUrl`, `createdAt` | In-order messaging |
| **reviews** | `id`, `orderId`, `reviewerId`, `revieweeId`, `rating`, `comment` | Post-order ratings |
| **disputes** | `id`, `orderId`, `initiatorId`, `reason`, `evidence[]`, `status` | Dispute tracking |
| **transactions** | `id`, `userId`, `type`, `amount`, `orderId`, `createdAt` | Wallet ledger |
| **notifications** | `id`, `userId`, `type`, `title`, `body`, `requestId`, `planId`, `read` | Push/in-app notifications |
| **uploads** | `id`, `ownerId`, `path`, `createdAt` | Metadata for user uploads |

#### Key API Endpoints (60+)

**Authentication**

```code
POST   /api/auth/login                  # Passwordless signup/login
GET    /api/auth/me                     # Current user (requires Bearer token)
```code

**User Management**

```code
GET    /api/users/{user_id}             # Public user profile
PATCH  /api/users/me                    # Update avatar, bio, name
POST   /api/users/kyc                   # Submit KYC → verified
GET    /api/users/{user_id}/reviews     # User's reviews
```code

**Requests (Shopping)**

```code
POST   /api/requests                    # Create request (buyer)
GET    /api/requests                    # List open requests (with filters)
GET    /api/requests/mine               # My requests (buyer)
GET    /api/requests/{req_id}           # Request detail + offers
GET    /api/requests/{req_id}/availability  # "N travellers can deliver"
```code

**Orders (Escrow Workflow)**

```code
POST   /api/orders/accept               # Traveller submits offer
POST   /api/orders/{order_id}/respond   # Buyer accepts/rejects offer
POST   /api/orders/{order_id}/stake     # Traveller stakes collateral
POST   /api/orders/{order_id}/fund      # Buyer funds escrow
POST   /api/orders/{order_id}/purchased # Traveller uploads receipt (in_transit)
POST   /api/orders/{order_id}/arrived   # Traveller marks arrived
POST   /api/orders/{order_id}/handoff-spot # Set meetup location
POST   /api/orders/{order_id}/qr-secret # Generate QR secret
POST   /api/orders/{order_id}/complete  # Buyer confirms handoff (release funds)
POST   /api/orders/{order_id}/cancel    # Cancel order (with slashing)
POST   /api/orders/{order_id}/dispute   # File dispute
GET    /api/orders                      # List all orders (paginated)
GET    /api/orders/mine                 # My orders (buying + traveling)
GET    /api/orders/{order_id}           # Order detail (enriched)
```code

**Travel Plans & Matching**

```code
POST   /api/travel-plans                # Create travel plan
GET    /api/travel-plans/mine           # My active trips
POST   /api/travel-plans/{plan_id}/cancel # Cancel trip
GET    /api/travel-plans/{plan_id}/matches # Requests matching this trip
GET    /api/availability                # Route availability (planned + past)
```code

**Chat**

```code
POST   /api/orders/{order_id}/chat      # Send message (text or image)
GET    /api/orders/{order_id}/chat      # Fetch chat history
```code

**Reviews & Reputation**

```code
POST   /api/reviews                     # Submit review (after order complete)
GET    /api/users/{user_id}/reviews     # User's reviews
```code

**Disputes & Resolution**

```code
POST   /api/disputes                    # File dispute (with evidence photos)
GET    /api/disputes/{dispute_id}       # Dispute detail
POST   /api/disputes/{dispute_id}/resolve # Arbitrator decision (refund/release)
```code

**Wallet & Transactions**

```code
GET    /api/wallet                      # User balance + locked funds
POST   /api/wallet/deposit              # Add funds (testnet faucet or real)
POST   /api/wallet/withdraw             # Withdraw funds
GET    /api/wallet/transactions         # Transaction history
```code

**Notifications**

```code
GET    /api/notifications               # List notifications
GET    /api/notifications/unread-count  # Unread count
POST   /api/notifications/read-all      # Mark all read
```code

**Files & Uploads**

```code
POST   /api/upload                      # Upload image/receipt/evidence
GET    /api/files/{path}                # Download file (proxies Emergent storage)
```code

**Chain Configuration**

```code
GET    /api/chain/config                # Escrow address + RPC + Reown project ID
```code

#### Order State Machine (Backend Logic)

```code
INITIAL: offered (traveller submits offer with fee)
  ↓ [buyer accepts]
  ↓ agreed (buyer accepted the fee)
  ↓ [traveller stakes 15% collateral]
  ↓ funded (both parties funded)
  ↓ [traveller uploads receipt]
  ↓ purchased (traveller purchased item)
  ↓ [traveller confirms purchased]
  ↓ in_transit (item traveling to destination)
  ↓ [traveller arrives]
  ↓ arrived (awaiting handoff)
  ↓ [traveller generates QR]
  ↓ handoff_pending (awaiting buyer confirmation)
  ↓ [buyer scans QR or enters code]
  ↓ completed (handoff confirmed → release funds + unlock stake)

TERMINAL STATES:
  cancelled    (order cancelled with slashing)
  disputed     (escalated to arbitrator)
  refunded     (arbitrator refunded buyer)
```code

#### Key Calculations

```codepython
# Escrow breakdown
itemPrice = 100.00
serviceFee = 10.00  # proposed by traveller
platformFee = (itemPrice + serviceFee) * 0.03 = 3.30
totalEscrow = itemPrice + serviceFee + platformFee = 113.30

# Staking
stake = itemPrice * 0.15 = 15.00  # traveller's collateral

# Payout (on successful completion)
travelerPayout = serviceFee + reward - platformFee
buyerEscrowRelease = itemPrice + serviceFee + platformFee
```code

#### Async Operations & Background Tasks

The backend uses **motor** (async MongoDB driver) for all DB operations. No explicit task queue (Celery, etc.); processing is synchronous within HTTP handlers.

**Key async patterns:**

- `await db.users.find_one({...})`
- `await db.orders.insert_one({...})`
- `await run_in_threadpool(put_object, path, data, ct)` — Emergent storage (blocking I/O)

**Notifications:** Stored in DB; frontend polls `/api/notifications` on tab focus.

---

## Database Schema

### Core Collections

#### users

```codejavascript
{
  "_id": ObjectId,  // MongoDB ID
  "id": "uuid",
  "name": "string",
  "email": "string (unique, lowercase)",
  "avatar": "string or null (path to image)",
  "bio": "string",
  "walletAddress": "0x...",
  "kycStatus": "unverified | verified",
  "reputation": 4.5,  // average of ratings
  "reviewsCount": 12,
  "ordersCompleted": 5,  // as buyer
  "tripsCompleted": 8,   // as traveller
  "usdcBalance": 150.50,
  "lockedBalance": 75.00,  // escrowed funds
  "token": "uuid (session token)",
  "acceptedTermsAt": "ISO string or null",
  "createdAt": "ISO string"
}
```code

#### requests

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "buyerId": "uuid",
  "title": "string",
  "description": "string",
  "category": "Beauty | Electronics | Fashion | Other",
  "image": "string (URL to image)",
  "itemPrice": 99.99,
  "maxItemPrice": 120.00,  // max buyer willing to pay
  "reward": 25.00,  // traveller reward
  "fromCountry": "France",
  "fromCity": "Paris",
  "toCountry": "Indonesia",
  "toCity": "Jakarta",
  "deadline": "ISO string or null",
  "status": "open | closed",
  "createdAt": "ISO string",
  "deletedAt": "ISO string or null"
}
```code

#### orders

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "requestId": "uuid",
  "buyerId": "uuid",
  "travelerId": "uuid",
  "itemPrice": 99.99,
  "reward": 25.00,
  "proposedFee": 10.00,  // traveller's proposed service fee
  "serviceFee": 10.00,   // accepted fee
  "stake": 15.00,        // 15% of itemPrice
  "platformFeePct": 0.03,
  "platformFee": 3.30,   // calculated on completion
  "payout": 35.00,       // traveller's actual payout
  "status": "offered | agreed | funded | purchased | in_transit | arrived | handoff_pending | completed | cancelled | disputed",
  "buyerFunded": true,
  "travelerStaked": true,
  "receiptUrl": "string (path to receipt image)",
  "receiptHash": "0x...",  // keccak256 of receipt
  "qrHash": "0x...",       // keccak256(secret + orderId)
  "note": "string",
  "timeline": [
    { "status": "offered", "at": "ISO string" },
    { "status": "agreed", "at": "ISO string" },
    ...
  ],
  "createdAt": "ISO string"
}
```code

#### travel_plans

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "userId": "uuid",
  "fromCountry": "France",
  "fromCity": "Paris",
  "toCountry": "Indonesia",
  "toCity": "Jakarta",
  "departDate": "2026-09-15",
  "returnDate": "2026-09-30",
  "note": "string",
  "capacity": 5,
  "status": "active | cancelled",
  "createdAt": "ISO string"
}
```code

#### chat_messages

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "orderId": "uuid",
  "senderId": "uuid",
  "text": "string",
  "imageUrl": "string or null (path to image)",
  "readBy": ["uuid1", "uuid2"],  // receipts
  "createdAt": "ISO string"
}
```code

#### reviews

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "orderId": "uuid",
  "reviewerId": "uuid (who gave review)",
  "revieweeId": "uuid (who received review)",
  "rating": 5,  // 1–5 stars
  "comment": "string",
  "createdAt": "ISO string"
}
```code

#### disputes

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "orderId": "uuid",
  "initiatorId": "uuid",
  "reason": "string",
  "evidence": ["path1", "path2"],  // uploaded image paths
  "status": "open | resolved",
  "resolution": "refund | release | custom",
  "resolvedBy": "uuid (arbitrator)",
  "resolvedAt": "ISO string or null",
  "createdAt": "ISO string"
}
```code

#### transactions

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "userId": "uuid",
  "type": "deposit | locked | released | slashed | withdrawal",
  "amount": 50.00,
  "orderId": "uuid or null",
  "note": "string",
  "createdAt": "ISO string"
}
```code

#### notifications

```codejavascript
{
  "_id": ObjectId,
  "id": "uuid",
  "userId": "uuid",
  "type": "traveller_match | order_accepted | purchase_confirmed | arrived | completed | dispute | review",
  "title": "string",
  "body": "string",
  "requestId": "uuid or null",
  "planId": "uuid or null",
  "read": false,
  "createdAt": "ISO string"
}
```code

---

## Navigation & Screen Flow

### Tab Navigation Hierarchy

```code
RootLayout (_layout.tsx)
│
├─ AuthProvider (context)
│
├─ [unauthenticated] → Login (modal)
│
└─ [authenticated] → TabsLayout (_layout.tsx)
    │
    ├─ Explore tab
    │   └── explore.tsx
    │       └─ [tap card] → Stack.Screen("request/[id]")
    │
    ├─ Trips tab
    │   └── trips.tsx (dual-tab: My Trips | Inbox)
    │       └─ [tap plan] → Stack.Screen("travel-plan") modal (edit)
    │       └─ [tap inbox item] → Stack.Screen("request/[id]") modal
    │
    ├─ Orders tab
    │   └── orders.tsx
    │       └─ [tap order] → Stack.Screen("order/[id]") modal
    │
    ├─ Wallet tab (hidden in navbar, accessible via Explore header chip)
    │   └── wallet.tsx (shown as modal overlay or dedicated screen)
    │
    └─ Profile tab
        └── profile.tsx
            └─ [tap "Edit KYC"] → Stack.Screen("kyc") modal
            └─ [tap "Settings"] → inline edit
```code

### Modal Flows (Stack.Screen with presentation="modal")

| Screen | Entry Point | Purpose |
| -------- | ------------- | --------- |
| `login.tsx` | On app load (no auth) | Passwordless login |
| `post.tsx` | Explore tab FAB or Trips→Post | Create shopping request |
| `travel-plan.tsx` | Trips tab→My Trips→Create | Create travel plan |
| `kyc.tsx` | Profile tab→KYC button | Submit KYC verification |
| `request/[id].tsx` | From Explore or Trips Inbox | View request detail + accept |
| `order/[id].tsx` | From Orders tab | View order tracking + actions |
| `chat/[id].tsx` | From OrderDetail | In-order messaging |
| `qr/[id].tsx` | From OrderDetail (handoff_pending) | Show QR + manual code |
| `scan/[id].tsx` | From OrderDetail (handoff_pending) | Scan QR or enter code |
| `review/[id].tsx` | After order completes | Rate counterparty |
| `dispute/[id].tsx` | From OrderDetail (any state) | File dispute |
| `user/[id].tsx` | Tap user avatar/name in cards | View public profile |

### Navigation Patterns

#### Pattern 1: Marketplace → Detail → Accept

```code
Explore (tab)
  ↓ [tap card]
  ↓ request/[id] (modal)
    - Shows hero image, details, availability
    - Offers list (if any)
    ↓ [tap "Accept & Escrow"]
    ↓ Order created ("offered" state)
    ↓ Route to order/[id] (modal)
```code

#### Pattern 2: Traveller Journey → Inbox → Accept

```code
Trips (tab) → Inbox tab
  ↓ [tap matching request]
  ↓ request/[id] (modal)
    - Shows buyer, route, reward
    ↓ [tap "Accept & Escrow"]
    ↓ Order created ("offered" state)
    ↓ Route to order/[id] (modal)
```code

#### Pattern 3: Order Lifecycle

```code
order/[id] (modal)
  ↓ Timeline shows: offered → agreed → funded → purchased → in_transit → arrived → handoff_pending → completed
  ↓ Role-based CTAs at each step (sticky at bottom)
  ↓ [traveller: tap "Scan QR"]
  ↓ scan/[id] (modal)
  ↓ [buyer confirms handoff]
  ↓ Order moves to "completed"
  ↓ [both see "Rate" prompts]
  ↓ review/[id] (modal)
```code

#### Pattern 4: Chat Integration

```code
order/[id]
  ↓ [scroll down or tap "Chat" button]
  ↓ chat/[id] (modal or inline scroll)
    - Shows message bubbles
    - Input field at bottom
    - [pick photo] → upload
    - [send] → message posted
```code

---

## UX/UI Design System

### Design Language

- **Personality:** iOS-Native Clean (premium, trusted, minimal)
- **Color Palette:** Sage Green (trust) + Terracotta (warmth) + Light neutrals
- **Typography:** Plus Jakarta Sans (modern, geometric)
- **Spacing:** Generous vertical breathing room (lg/xl padding on cards)
- **Radius:** 6 (sm), 12 (md), 20 (lg), 999 (pill)
- **Icons:** Phosphor icon set via @expo/vector-icons (Ionicons)

### Design Tokens (from `theme.ts`)

```codetypescript
// Colors
colors = {
  surface: "#FCFBFA",            // Off-white background
  onSurface: "#1C1C1E",          // Dark text on surface
  surfaceSecondary: "#FFFFFF",   // White cards
  onSurfaceSecondary: "#1C1C1E", // Dark text on white
  surfaceTertiary: "#F2F0ED",    // Light gray background
  onSurfaceTertiary: "#3A393B",  // Muted text
  surfaceInverse: "#1C1C1E",     // Dark overlay (for gradient scrims)
  onSurfaceInverse: "#FFFFFF",   // White text on dark

  brand: "#2A5A4A",              // Sage green (primary CTA)
  brandPrimary: "#2A5A4A",
  onBrandPrimary: "#FFFFFF",     // White text on sage
  brandSecondary: "#C97A5E",     // Terracotta (secondary CTA, rewards)
  onBrandSecondary: "#FFFFFF",   // White text on terracotta
  brandTertiary: "#E7F0EC",      // Sage tint (active chip background)
  onBrandTertiary: "#2A5A4A",    // Sage text on tinted bg

  success: "#30825B",            // Green (completed, success)
  onSuccess: "#FFFFFF",
  warning: "#F29C38",            // Orange (caution, rewards badge)
  onWarning: "#1C1C1E",
  error: "#D94436",              // Red (error, dispute)
  onError: "#FFFFFF",
  info: "#F2F0ED",               // Light gray (neutral info)
  onInfo: "#1C1C1E",

  border: "#E5E3E0",             // Light border
  borderStrong: "#D1CCC5",       // Darker border
  divider: "#E5E3E0",
  muted: "#8A8781",              // Gray text (secondary)
};

// Spacing (in dp/pt)
spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48
};

// Radius
radius = {
  sm: 6, md: 12, lg: 20, pill: 999
};

// Typography
font = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semibold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extrabold: "Jakarta-ExtraBold",
};

type = {
  sm: 12, base: 14, lg: 16, xl: 20, "2xl": 24, "3xl": 30
};

// Shadows (soft, card)
shadow = {
  card: { shadowColor, shadowOffset, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  soft: { shadowColor, shadowOffset, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
};
```code

### Glassmorphism (Premium Detail)

- **Usage:** Sticky headers over scrolling feeds, bottom tab bar, featured card overlays
- **Implementation:** iOS uses `expo-glass-effect`; Android falls back to `expo-blur`; low-end Android uses solid color
- **Rule:** Never blur form inputs or dense text; always use heavy tint layer behind blur

### Key UI Patterns

#### 1. Card Layout (Marketplace)

```code
┌─────────────────┐
│   [Hero Image]  │  ← High-quality image, no scrim needed on marketplace
│                 │
├─────────────────┤
│ Item Title      │  ← 2 lines max, semibold
├─────────────────┤
│ France → Indonesia│ ← Route with arrow icon
├─────────────────┤
│ 🎯 +$25         │  ← Reward badge (terracotta)
│ Buyer: JD ⭐    │  ← Buyer avatar + star
└─────────────────┘
```code

#### 2. Hero Image with Gradient Scrim (Detail Screens)

```code
┌─────────────────┐
│                 │
│  [Image]        │  ← Product image, top 30% of screen
│                 │  ← Linear gradient (transparent → 70% dark) overlaid from top to bottom
│  Item Title     │  ← White text over gradient
│  +$25 Reward    │  ← White text over gradient
└─────────────────┘
```code

#### 3. Sticky Primary CTA

```code
                         ┌─────────────────────────┐
                         │ Scrollable Content      │
                         │ (list, form, timeline) │
                         │                        │
                         └────────────────────────┘
[Safe Area Bottom]
┌────────────────────────────────────┐
│ [Primary Button - Full Width]      │  ← Glass overlay (if scrolling)
│ Accept & Escrow                    │  ← Sage green, sticky
└────────────────────────────────────┘
```code

#### 4. Vertical Stepper (Order Timeline)

```code
Offered          ✓   ← Completed step, checkmark
  ↓
Agreed           ◉   ← Current step, dot
  ↓
Funded           ○   ← Future step, empty dot
  ↓
Purchased        ○
  ↓
In Transit       ○
  ↓
Arrived          ○
  ↓
Handoff Pending  ○
  ↓
Completed        ○

[Sticky Card at Bottom]
┌─────────────────────────────────┐
│ Traveller: John Doe             │
│ Reputation: 4.8 ⭐ (42 reviews) │
│ [Chat] [Call] [Cancel]          │
└─────────────────────────────────┘
```code

#### 5. Badge Variants

```code
Tone        Background  Foreground  Icon
─────────────────────────────────────────
brand       Sage tint   Sage        N/A
success     Green tint  Green       ✓
warning     Orange tint Orange      ⚠
error       Red tint    Red         ✗
muted       Gray        Gray        N/A
```code

#### 6. Empty States

```code
┌─────────────────────────────────┐
│                                 │
│           [Icon]                │  ← Large, muted
│                                 │
│      No Orders Yet              │  ← Headline
│                                 │
│  Post a request as a buyer      │  ← Subtitle (2 lines)
│  or accept one as a traveller   │
│                                 │
│   [Change Filters] (outline)    │  ← CTA
│                                 │
└─────────────────────────────────┘
```code

### Accessibility Notes

- **Text Contrast:** All text meets WCAG AA (7+ ratio on critical paths)
- **Touch Targets:** Minimum 44 × 44 pt
- **Color Blindness:** Avoid red-green pairs; always include icon/text fallback
- **Font Scaling:** Responsive to system font size (no fixed layouts)

---

## Component Hierarchy

### Component Tree (Conceptual)

```code
<RootLayout>
  <GestureHandlerRootView>
    <SafeAreaProvider>
      <AuthProvider>
        <Stack>
          {/* Auth */}
          <Stack.Screen name="login" />

          {/* Modals */}
          <Stack.Screen name="post" />
          <Stack.Screen name="kyc" />
          <Stack.Screen name="travel-plan" />
          <Stack.Screen name="request/[id]" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="qr/[id]" />
          <Stack.Screen name="scan/[id]" />
          <Stack.Screen name="review/[id]" />
          <Stack.Screen name="dispute/[id]" />
          <Stack.Screen name="user/[id]" />

          {/* Tabs (main navigation) */}
          <Stack.Screen name="(tabs)">
            <Tabs>
              <Tabs.Screen name="explore">
                <Explore>
                  <FlatList>
                    {items.map(item => (
                      <Pressable key={item.id} onPress={() => navigate(`request/${item.id}`)}>
                        <Card>
                          <Image source={{ uri: item.image }} />
                          <AppText>{item.title}</AppText>
                          <Avatar name={item.buyer.name} />
                        </Card>
                      </Pressable>
                    ))}
                  </FlatList>
                </Explore>
              </Tabs.Screen>

              <Tabs.Screen name="trips">
                <Trips>
                  <Tabs>
                    <Tabs.Screen name="my-trips">
                      <FlatList>
                        {plans.map(plan => (
                          <PlanCard key={plan.id}>
                            <AppText>{plan.fromCountry} → {plan.toCountry}</AppText>
                            <Badge label={plan.matchCount} tone="brand" />
                          </PlanCard>
                        ))}
                      </FlatList>
                    </Tabs.Screen>

                    <Tabs.Screen name="inbox">
                      <FlatList>
                        {inbox.map(req => (
                          <RequestCard key={req.id} request={req} />
                        ))}
                      </FlatList>
                    </Tabs.Screen>
                  </Tabs>
                </Trips>
              </Tabs.Screen>

              <Tabs.Screen name="orders">
                <Orders>
                  <Segment>
                    {["All", "Buying", "Traveling"].map(filter => (
                      <SegmentButton key={filter} active={currentFilter === filter}>
                        {filter}
                      </SegmentButton>
                    ))}
                  </Segment>
                  <FlatList>
                    {orders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </FlatList>
                </Orders>
              </Tabs.Screen>

              <Tabs.Screen name="wallet">
                <Wallet>
                  <BalanceCard>
                    <AppText size="2xl">${balance}</AppText>
                    <Button>Deposit</Button>
                    <Button>Withdraw</Button>
                  </BalanceCard>
                  <FlatList>
                    {transactions.map(tx => (
                      <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </FlatList>
                </Wallet>
              </Tabs.Screen>

              <Tabs.Screen name="profile">
                <Profile>
                  <Avatar name={user.name} />
                  <AppText>{user.name}</AppText>
                  <AppText size="sm" color={colors.muted}>{user.bio}</AppText>
                  <Button variant="outline">Edit Profile</Button>
                  <ReviewList reviews={reviews} />
                  <Button>KYC Verification</Button>
                  <Button variant="danger">Logout</Button>
                </Profile>
              </Tabs.Screen>
            </Tabs>
          </Stack.Screen>
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
</RootLayout>
```code

### Reusable Component Props

```codetypescript
// AppText
interface AppTextProps extends TextProps {
  weight?: "regular" | "medium" | "semibold" | "bold" | "extrabold";
  size?: number;
  color?: string;
}

// Button
interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
}

// Badge
interface BadgeProps {
  label: string;
  tone?: "brand" | "success" | "warning" | "error" | "muted";
  icon?: keyof typeof Ionicons.glyphMap;
}

// Avatar
interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
}

// Card
interface CardProps extends ViewProps {
  children: React.ReactNode;
}

// EmptyState
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  testID?: string;
}
```code

---

## State Management

### Current Approach (React Context + useState)

```codetypescript
// AuthContext: Global auth state
export const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await storage.secureGet<string>(TOKEN_KEY, "");
      if (!token) {
        setUserState(null);
        return;
      }
      const me = await api.get("/auth/me");
      setUserState(me);
    } catch {
      setUserState(null);
    }
  }, []);

  // ... login, logout, setUser methods

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```code

### Per-Screen State (useState + useFocusEffect)

```codetypescript
// Explore.tsx
export default function Explore() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [dest, setDest] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (cat !== "All") params.append("category", cat);
    if (dest) params.append("toCountry", dest);
    if (q.trim()) params.append("q", q.trim());
    const data = await api.get(`/requests?${params.toString()}`);
    setItems(data);
    setLoading(false);
  }, [cat, dest, q]);

  // Refetch when screen focuses
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ... render
}
```code

### Storage (Persistent Key-Value)

```codetypescript
// @react-native-async-storage (web) / @react-native-async-storage (native)
export const storage = {
  async secureGet<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    // Uses expo-secure-store on native; localStorage on web
  },
  async secureSet(key: string, value: string): Promise<void> {
    // Encrypts on native; JSON stringifies on web
  },
  async secureRemove(key: string): Promise<void> {},
};
```code

### HTTP Client (Fetch-based)

```codetypescript
export const api = {
  async get(path: string) {
    const res = await fetch(`${API}${path}`, {
      headers: { ...(await authHeader()) }
    });
    return handle(res);
  },
  async post(path: string, body?: any) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handle(res);
  },
  // ... patch, uploadImage
};
```code

**Notable:** No Redux, Zustand, MobX, or Recoil. Pure React Context + local state, which works fine for this single-user app (no complex cross-screen state sharing).

---

## Web3 Integration

### Current Status

- **Solidity Contract:** `/contracts/USDCEscrow.sol` (ready to deploy)
- **Configuration:** `/frontend/src/web3/config.ts`
- **AppKit Provider:** `/frontend/src/web3/AppKitProvider.tsx` (scaffolded)
- **ABI:** `/frontend/src/web3/escrowAbi.ts`

### Activation Checklist

1. Deploy `USDCEscrow.sol` to Base Sepolia
2. Set `EXPO_PUBLIC_ESCROW_ADDRESS` in `.env`
3. Install Reown AppKit native deps
4. Generate native iOS/Android builds (required; won't run in Expo Go)
5. Register app bundle ID + deep link in Reown Dashboard

### On-Chain Order Flow

| App Action | Smart Contract Call |
| --- | --- |
| Buyer funds escrow | `USDC.approve(escrow, total)` → `createDeal(dealId, itemPrice, reward)` → `deposit(dealId)` |
| Traveller confirms handoff | `release(dealId)` (depositor or arbiter) |
| Dispute → refund | `refund(dealId)` (arbitrator multisig) |

### Deal ID Generation

```codetypescript
// Frontend
const dealIdHash = keccak256(orderId); // use order ID as secret seed
const dealId = dealIdHash.slice(0, 32); // truncate to bytes32

// Backend verifies: keccak256(secret + orderId) == on-chain dealId
```code

---

## Migration Strategy to Next.js

### Overview

Migrate from Expo/React Native to **Next.js 15** (App Router) + **TypeScript** + **Neon PostgreSQL** (Postgres) + **Redux** for state management.

### Technology Mapping

| Current | Target | Rationale |
| --------- | -------- | ----------- |
| **Expo (React Native)** | **Next.js 15 (React on Web)** | Full-stack web framework; SSR for SEO; full TypeScript support |
| **expo-router** | **Next.js App Router** | File-based routing; familiar pattern |
| **React Context** | **Redux Toolkit** | Centralized state; time-travel debugging; DevTools |
| **MongoDB** | **Neon (PostgreSQL)** | Relational schema; better for structured data; serverless |
| **FastAPI** | **Next.js API Routes** | Co-locate frontend + backend; TypeScript everywhere |
| **Emergent Storage** | **Vercel Blob or AWS S3** | Simpler integration; same-provider benefits |

### Project Structure (Next.js)

```code
trustmule-nextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (Redux, Providers)
│   ├── page.tsx                 # Home / login page
│   ├── (auth)/                  # Auth layout group
│   │   └── login/page.tsx
│   ├── (app)/                   # Protected layout group (with auth check)
│   │   ├── layout.tsx           # App layout (nav, sidebar)
│   │   ├── explore/
│   │   │   └── page.tsx         # Marketplace feed
│   │   ├── request/
│   │   │   └── [id]/page.tsx    # Request detail
│   │   ├── orders/
│   │   │   └── page.tsx         # My orders
│   │   │   └── [id]/page.tsx    # Order tracking
│   │   ├── trips/
│   │   │   └── page.tsx         # Travel plans + inbox
│   │   ├── wallet/
│   │   │   └── page.tsx         # Wallet view
│   │   ├── profile/
│   │   │   └── page.tsx         # User profile
│   │   └── user/
│   │       └── [id]/page.tsx    # Public user profile
│   ├── api/                      # API routes (backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── me/route.ts
│   │   ├── requests/
│   │   │   ├── route.ts         # GET /api/requests, POST
│   │   │   └── [id]/route.ts
│   │   ├── orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── stake/route.ts
│   │   │       ├── fund/route.ts
│   │   │       └── ...
│   │   ├── travel-plans/
│   │   ├── chat/
│   │   ├── wallet/
│   │   ├── upload/route.ts      # File upload
│   │   └── chain/config/route.ts
│   └── error.tsx                # Global error boundary
│
├── components/                   # Reusable React components
│   ├── ui/                      # Design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── EmptyState.tsx
│   │   └── ...
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── marketplace/
│   │   ├── RequestCard.tsx
│   │   ├── RequestGrid.tsx
│   │   └── RequestDetail.tsx
│   ├── orders/
│   │   ├── OrderCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   └── OrderActions.tsx
│   └── ...
│
├── lib/                          # Utilities
│   ├── api-client.ts            # Fetch wrapper with auth
│   ├── constants.ts
│   ├── locations.ts
│   ├── validators.ts
│   └── web3/
│       ├── config.ts
│       ├── escrow-abi.ts
│       └── client.ts
│
├── redux/                        # Redux store + slices
│   ├── store.ts                 # Store config
│   ├── hooks.ts                 # useAppDispatch, useAppSelector
│   ├── slices/
│   │   ├── auth.slice.ts        # User state + login/logout/refresh
│   │   ├── orders.slice.ts      # Orders cache
│   │   ├── requests.slice.ts    # Requests cache
│   │   ├── wallet.slice.ts      # Wallet state
│   │   ├── ui.slice.ts          # UI state (modals, filters, etc.)
│   │   └── ...
│   └── middleware/
│       └── auth.middleware.ts   # Hydrate auth on app load
│
├── styles/                       # Global styles
│   ├── globals.css
│   ├── theme.css                # Design tokens (CSS variables)
│   └── ...
│
├── db/                          # Database layer
│   ├── index.ts                 # Neon client
│   ├── migrations/
│   │   └── 001_init.sql         # Schema
│   ├── queries/
│   │   ├── users.ts
│   │   ├── requests.ts
│   │   ├── orders.ts
│   │   └── ...
│   └── types.ts                 # TypeScript models
│
├── middleware.ts                 # Next.js middleware (auth checks)
├── .env.local                   # Secrets (NEON_DATABASE_URL, REOWN_PROJECT_ID, etc.)
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```code

### Key Changes & Adaptation

#### 1. **Frontend → Full Stack**

- Retire FastAPI backend; move all logic to `/app/api/routes`
- Use Next.js middleware for auth (JWT or session-based)
- API routes become RPC-style handlers (same interface, simpler deployment)

#### 2. **Database Migration (MongoDB → Neon/PostgreSQL)**

```codesql
-- Schema (Neon PostgreSQL)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  wallet_address VARCHAR(255),
  kyc_status VARCHAR(50) DEFAULT 'unverified',
  reputation DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  orders_completed INT DEFAULT 0,
  trips_completed INT DEFAULT 0,
  usdc_balance DECIMAL(20,6) DEFAULT 0,
  locked_balance DECIMAL(20,6) DEFAULT 0,
  token VARCHAR(255) UNIQUE,
  accepted_terms_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  image_url VARCHAR(500),
  item_price DECIMAL(20,2),
  max_item_price DECIMAL(20,2),
  reward DECIMAL(20,2),
  from_country VARCHAR(100),
  from_city VARCHAR(100),
  to_country VARCHAR(100),
  to_city VARCHAR(100),
  deadline TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ... orders, travel_plans, chat_messages, reviews, disputes, transactions, notifications
```code

#### 3. **State Management (Redux Toolkit)**

```codetypescript
// redux/slices/auth.slice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const login = createAsyncThunk(
  "auth/login",
  async ({ name, email, acceptedTerms }: { name: string; email: string; acceptedTerms: boolean }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, acceptedTerms }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem("token", data.token);
    return data.user;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null as User | null,
    loading: true,
    token: null as string | null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(login.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export default authSlice.reducer;
```code

#### 4. **Component Styling (Tailwind CSS or CSS-in-JS)**

```codetypescript
// components/ui/Button.tsx (using Tailwind)
import clsx from "clsx";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  onClick,
}: ButtonProps) {
  const baseClasses = "font-semibold rounded-lg transition-all";
  const variantClasses = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "bg-brand-secondary text-white",
    outline: "border-2 border-brand text-brand hover:bg-brand hover:text-white",
    danger: "bg-red-500 text-white",
  };
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed"
      )}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
```code

#### 5. **API Routes (Next.js)**

```codetypescript
// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const toCountry = req.nextUrl.searchParams.get("toCountry");
  const q = req.nextUrl.searchParams.get("q");

  let sql = "SELECT * FROM requests WHERE status = 'open' AND deleted_at IS NULL";
  const params = [];

  if (category && category !== "All") {
    sql += ` AND category = $${params.length + 1}`;
    params.push(category);
  }
  if (toCountry) {
    sql += ` AND to_country = $${params.length + 1}`;
    params.push(toCountry);
  }
  if (q) {
    sql += ` AND title ILIKE $${params.length + 1}`;
    params.push(`%${q}%`);
  }

  sql += " ORDER BY created_at DESC LIMIT 200";

  try {
    const requests = await query(sql, params);
    return NextResponse.json(requests);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  const body = await req.json();

  // Validation & insert logic
  // ...

  return NextResponse.json({ id: newId, ...body });
}
```code

#### 6. **Authentication (JWT or Session)**

```codetypescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Protect (app) routes
  if (req.nextUrl.pathname.startsWith("/(app)")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(app)/:path*"],
};
```code

#### 7. **Redux Middleware & Store**

```codetypescript
// redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import ordersReducer from "./slices/orders.slice";
import uiReducer from "./slices/ui.slice";
import { authMiddleware } from "./middleware/auth.middleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```code

---

## Summary & Next Steps

### What We've Learned (Current Architecture)

1. **Frontend:** Expo/React Native with expo-router; React Context for state; pure fetch for API
2. **Backend:** FastAPI with MongoDB; Emergent-managed storage; 60+ endpoints covering full escrow workflow
3. **Design:** iOS-Native Clean (Sage + Terracotta); generous spacing; Glassmorphism for polish
4. **UX Flows:** 8 core journeys (Browse, Post, Travel Plan, Order Tracking, Wallet, Reviews, Disputes, QR Handoff)
5. **State Machine:** 9-step order lifecycle from offer to completion + dispute/cancellation paths
6. **Web3:** Solidity contract ready; Reown AppKit scaffolded; activates on native build + escrow address set

### Migration Roadmap to Next.js + Redux + Neon

**Phase 1: Setup & Infra**

- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up Neon PostgreSQL database + connection pool
- [ ] Initialize Redux store + auth slice
- [ ] Set up middleware for auth checks

**Phase 2: Backend API**

- [ ] Migrate all FastAPI endpoints to Next.js API routes (`/app/api/`)
- [ ] Implement JWT/session auth in middleware
- [ ] Migrate MongoDB schema to PostgreSQL migrations
- [ ] Set up query builders for all collections → tables

**Phase 3: Frontend Pages**

- [ ] Create layout hierarchy (`(auth)`, `(app)`, etc.)
- [ ] Rebuild all 11 screens as Next.js pages with Tailwind/CSS modules
- [ ] Wire Redux slices to page components (useAppSelector, useAppDispatch)
- [ ] Test client-side routing & state hydration

**Phase 4: Component System**

- [ ] Port all UI primitives (Button, Card, Badge, Avatar, EmptyState) to React
- [ ] Maintain design tokens (colors, spacing, radius, typography) via CSS variables or Tailwind config
- [ ] Ensure responsive design (desktop first, then mobile)

**Phase 5: Web3 & Integrations**

- [ ] Integrate wagmi + Reown AppKit (for Next.js, not native-only)
- [ ] Implement on-chain escrow calls in API routes (e.g., `/api/orders/[id]/fund`)
- [ ] Test with Base Sepolia testnet

**Phase 6: Testing & Deployment**

- [ ] E2E tests (Jest, React Testing Library)
- [ ] Deploy to Vercel (Next.js native platform)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Smoke test full user journeys

---

**This document serves as the authoritative reference for TrustMule's architecture, UX/UI design, and migration strategy. Keep it updated as the system evolves.**
