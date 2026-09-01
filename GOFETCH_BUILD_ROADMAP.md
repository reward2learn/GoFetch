# GoFetch Delivery Marketplace — Build Roadmap

> **Purpose**: Step-by-step guide for building the GoFetch P2P delivery marketplace using the **TokenizMyApp factory platform**. This roadmap documents how to create, configure, and deploy GoFetch as a tenant app through the Platform Admin wizard, leveraging the `delivery-marketplace` template already registered in the template catalog.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Platform Admin — Create GoFetch Tenant](#3-phase-1-platform-admin--create-gofetch-tenant)
4. [Phase 2: Template & Navigation Selection](#4-phase-2-template--navigation-selection)
5. [Phase 3: AI App-Pack Generation Pipeline](#5-phase-3-ai-app-pack-generation-pipeline)
6. [Phase 4: Neon Database Provisioning](#6-phase-4-neon-database-provisioning)
7. [Phase 5: Vercel Deployment](#7-phase-5-vercel-deployment)
8. [Phase 6: Web3 & Social Wallet Integration](#8-phase-6-web3--social-wallet-integration)
9. [Phase 7: Post-Deployment Configuration](#9-phase-7-post-deployment-configuration)
10. [Phase 8: Development & Customization](#10-phase-8-development--customization)
11. [Key Files & References](#11-key-files--references)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

### TokenizMyApp Factory Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM ADMIN (tokenizmyapp)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Tenant Wizard │→│ AI Generator │→│ Vercel Deploy Service │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         ↓                  ↓                    ↓                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Neon Provision│  │ App Pack     │  │ Vercel Project       │  │
│  │ (per-tenant)  │  │ Materializer │  │ (per-tenant)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              GOFETCH TENANT APP (delivery-marketplace)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ App Shell │  │ Pages    │  │ Web3     │  │ ZenStack     │   │
│  │ (MUI)    │  │ (DB-drv) │  │ Wallet   │  │ Schema       │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│         ↓              ↓              ↓              ↓           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Neon PostgreSQL (tenant-isolated)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### GoFetch Template Registration

The `delivery-marketplace` template is **already registered** in:
- **File**: `tokenizmyapp/src/domain/tenant/template-catalog.ts` (lines 604-682)
- **Template ID**: `delivery-marketplace`
- **Label**: "GoFetch — Delivery Marketplace"
- **Icon**: `LocalShipping`
- **Colors**: Sage Green `#2A5A4A` (Trust) + Terracotta `#C97A5E` (Warmth)
- **Web3**: Enabled with social + injected wallets, Base Sepolia (chain 84532)
- **Currency**: USDC escrow
- **Roles**: buyer, traveler, arbitrator, admin

### Pre-configured Pages (8 pages + system pages)

| Page | Slug | Auth Tier | Block Types |
|------|------|-----------|-------------|
| Home | `/` | public | hero |
| Dashboard | `/dashboard` | public | hero, kpi_cards |
| Explore Requests | `/explore` | public | hero, dynamic_form |
| My Orders | `/orders` | google | dynamic_form |
| Travel Plans | `/trips` | google | dynamic_form |
| Wallet | `/wallet` | google | kpi_cards |
| Messages | `/chat` | google | (chat panel) |
| Profile | `/profile` | google | dynamic_form |
| Summary | `/summary` | google | (system) |
| Tasks | `/tasks` | pin | (system) |
| Notes | `/notes` | pin | (system) |
| Admin | `/admin` | pin | (system) |

### Pre-configured Navigation (8 nav items)

```
Home (/)         → icon: Home
Explore (/explore) → icon: Search
Orders (/orders)  → icon: ShoppingBag
Trips (/trips)    → icon: Flight
Wallet (/wallet)  → icon: AccountBalanceWallet
Messages (/chat)  → icon: Chat
Profile (/profile) → icon: Person
Admin (/admin)    → icon: Settings (pin-only)
```

---

## 2. Prerequisites

### Platform Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| TokenizMyApp running | ✅ | Platform admin at `tokenizmyapp.vercel.app` |
| Vercel team access | ✅ | Team token configured for deployments |
| Neon API key | ✅ | `NEON_API_KEY` env var for branch provisioning |
| OpenAI API key | ✅ | For AI schema generation (GPT-5.5) |
| GitHub repo | ✅ | `iliashapiro/GoFetch` (main branch) |
| Web3 config | ✅ | Reown AppKit project ID, Base Sepolia |

### Environment Variables (Platform Admin)

```env
# Required for tenant deployments
NEON_API_KEY=neon_xxx
OPENAI_API_KEY=sk-xxx
VERCEL_TOKEN=xxx

# Web3 / Wallet
REOWN_PROJECT_ID=xxx
NEXT_PUBLIC_REOWN_PROJECT_ID=xxx

# Base Sepolia (chain ID 84532)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634c722303754C762b5cB287
```

---

## 3. Phase 1: Platform Admin — Create GoFetch Tenant

### Step 3.1: Access Platform Admin

1. Navigate to the TokenizMyApp platform admin dashboard
2. Click **"New Tenant"** button (opens the `TenantWizard` dialog)

**File reference**: `tokenizmyapp/src/components/ops-admin/tenant-wizard.tsx`

### Step 3.2: Business Info (Step 0 of 8)

| Field | Value |
|-------|-------|
| **Business Slug** | `gofetch` |
| **Display Name** | `GoFetch` |

**Optional — AI Scrape**: Enter `https://gofetch.co` (or existing site URL) to auto-extract:
- Business name
- Logo (base64)
- Brand colors
- Description/prompt

**Slug validation**: lowercase letters, numbers, hyphens only. Becomes `gofetch.vercel.app`.

### Step 3.3: Template Selection (Step 1 of 8)

| Setting | Value |
|---------|-------|
| **Template Mode** | `Single App` |
| **Template** | `GoFetch — Delivery Marketplace` |

The wizard will show the `delivery-marketplace` template card with:
- Description: "P2P global shopping & delivery with USDC escrow..."
- Schema.org type: `WebApplication`
- XSD Standard: `UBL (orders), ISO 20022 (payment)`
- Pages: Explore, Orders, Trips, Wallet, Messages, Profile

**Note**: Do NOT enable Suite Mode — GoFetch is a single-template app.

### Step 3.4: AI Business Description (Step 2 of 8)

Enter a natural language description for AI schema generation:

```
I run GoFetch, a P2P global shopping and delivery marketplace in Bali, Indonesia.
Buyers post delivery requests (items they want from other cities/countries), and
travelers monetize their spare luggage space by fulfilling those requests. All
payments are in USDC with escrow protection. The platform has 9 order states:
PENDING → MATCHED → PAID → IN_TRANSIT → DELIVERED → CONFIRMED → REVIEW_PENDING → COMPLETED/DISPUTED.

Key features:
- Browse and filter delivery requests by route, category, price
- Post new delivery requests with item details, origin/destination, budget
- Create travel plans with route, dates, available luggage space
- USDC wallet with top-up, escrow, and withdrawal
- Real-time chat between buyer and traveler
- 5-star rating system with review text
- Dispute resolution with evidence upload
- Reputation scoring (completed deliveries, avg rating)
```

### Step 3.5: Branding (Step 3 of 8)

| Setting | Value |
|---------|-------|
| **Primary Color** | `#2A5A4A` (Sage Green — Trust) |
| **Secondary Color** | `#C97A5E` (Terracotta — Warmth) |
| **Logo** | Upload or use AI-extracted |
| **Loading Graphic** | Optional custom animation |

### Step 3.6: Database (Step 4 of 8)

| Setting | Value |
|---------|-------|
| **Mode** | `Auto-provision Neon (recommended)` |
| **Action** | Click **"Provision Neon now"** |

This creates an isolated Neon branch for the `gofetch` tenant. The wizard will show:
- Pooled URL: `postgresql://...@ep-xxx-pooler.neon.tech/gofetch`
- Direct URL: `postgresql://...@ep-xxx.neon.tech/gofetch`

**All suite apps share this single database** via `tenants.db_url`.

### Step 3.7: AI Rate Card (Step 5 of 8)

| Field | Value |
|-------|-------|
| **App Count** | 1 |
| **User Count** | Start with 1 (scale later) |
| **Annual Revenue (USD)** | $0 (pre-revenue) |
| **Mac Studio Cost** | Default or custom |
| **Monthly 3rd Party** | $0 |

### Step 3.8: AI Providers (Step 6 of 8)

Configure the AI provider for the tenant's chat assistant:

| Field | Value |
|-------|-------|
| **Active Provider** | OpenAI |
| **Active Model** | gpt-4o-mini |
| **API Key** | Enter tenant-specific key (optional) |

### Step 3.9: Review & Create (Step 7 of 8)

Review all settings, then click **"Create with AI"**.

**Pipeline executes automatically:**
1. AI Schema Generation (ZenStack models, use cases, pages)
2. Neon Database Branch (isolated per tenant)
3. Database Migrations (Prisma/Drizzle)
4. Seeding Defaults (nav items, pages, roles)
5. Code Generation (Next.js app code)
6. Vercel Deployment (git-linked project)

### Step 3.10: Success

After creation, the wizard shows:
- Status: `Live — Ready to use`
- URL: `https://gofetch.vercel.app`
- Pipeline status: All steps ✅

---

## 4. Phase 2: Template & Navigation Selection

### Template Catalog Entry

The `delivery-marketplace` template in `template-catalog.ts` provides:

```typescript
{
  id: 'delivery-marketplace',
  label: 'GoFetch — Delivery Marketplace',
  description: 'P2P global shopping & delivery with USDC escrow...',
  icon: 'LocalShipping',
  templateType: 'single',
  source: 'builtin',
  defaultColors: { primary: '#2A5A4A', secondary: '#C97A5E' },
  capabilities: {
    web3Wallet: {
      enabled: true,
      connectMode: 'both',  // Social + injected wallets
      socialProviders: ['google', 'apple'],
      emailLogin: true,
      chains: [84532],  // Base Sepolia
      showBalances: true,
      tokenGating: false,
    },
  },
  assistant: {
    role: 'delivery marketplace assistant',
    domain: 'P2P global shopping and delivery',
    currency: 'USDC',
    keyMetrics: ['orders_completed', 'reputation_score', 'delivery_time', 'escrow_value'],
    capabilities: [
      'Help find delivery requests by route and category',
      'Track order status through the 9-step escrow workflow',
      'Manage travel plans and inbox matching',
      'Explain staking, escrow, and fee structure',
      'Resolve disputes and review transactions',
    ],
    starterPrompt: 'Welcome to GoFetch! I can help you find delivery requests...',
  },
  defaultRoles: [
    { code: 'buyer', name: 'Buyer' },
    { code: 'traveler', name: 'Traveler' },
    { code: 'arbitrator', name: 'Arbitrator' },
    { code: 'admin', name: 'Admin', isPlatformAdmin: true },
  ],
  schemaOrgType: 'WebApplication',
  xsdStandard: 'UBL (orders), ISO 20022 (payment)',
}
```

### Navigation Layout

The App Shell (`tokenizmyapp/src/components/layout/app-shell.tsx`) provides:

**Desktop (≥ md breakpoint)**:
- Left sidebar (280px) with full navigation tree
- Collapsible drawer with search
- Chat panel as right drawer (pushes content)

**Mobile (< md breakpoint)**:
- Bottom navigation bar (8 items)
- Hamburger menu for overflow
- Chat as overlay drawer

**Auth Tier Gating**:
- `public`: Explore page (no login required)
- `google`: Orders, Trips, Wallet, Messages, Profile (requires Google OAuth)
- `pin`: Admin, Tasks, Notes (requires PIN)

---

## 5. Phase 3: AI App-Pack Generation Pipeline

### Two-Stage AI Generation

**File**: `tokenizmyapp/src/domain/app-pack/app-pack-generator.ts`

#### Stage 1: DECOMPOSE

The platform admin's requirement is turned into a structured pack definition:

```
Input: "I run GoFetch, a P2P delivery marketplace..."
  ↓
AI (GPT-5.5) + appPackDecompositionZod schema
  ↓
Output: {
  packId: "gofetch-marketplace-pack",
  apps: [
    { id: "marketplace", name: "Marketplace", templateId: "delivery-marketplace" },
    { id: "wallet", name: "Wallet & Payments", templateId: "delivery-marketplace" },
    { id: "logistics", name: "Logistics & Tracking", templateId: "delivery-marketplace" },
    ...
  ],
  ceoOverview: { purpose: "Cross-department KPIs...", kpis: [...] }
}
```

#### Stage 2: GENERATE (per app)

Each department app gets a full definition with:
- **W3C-aligned models** (UBL for orders, ISO 20022 for payments)
- **Use cases** with appropriate auth tiers
- **Pages** with template-specific blocks
- **Knowledge snippets** for AI assistant grounding
- **UX workflow** documentation

### Materialization

**File**: `tokenizmyapp/src/domain/app-pack/app-pack-materializer.ts`

The materializer persists compiled app packs into the tenant DB:

1. **DDL Setup**: Creates enums (`AuthTier`, `BlockType`), tables (`app_pages`, `page_sections`, `navigation_items`, `knowledge_snippets`, `security_groups`)
2. **Page Seeding**: Inserts pages with slug, title, auth tier, sort order
3. **Section Seeding**: Inserts page sections with block type and config JSONB
4. **Navigation Seeding**: Inserts nav items with parent hierarchy, icons, auth tiers
5. **Knowledge Seeding**: Inserts AI assistant context snippets

**Idempotent**: All writes are scoped by `packId` and replaced on re-run.

---

## 6. Phase 4: Neon Database Provisioning

### Per-Tenant Isolation

Each tenant gets an isolated Neon branch:

```
Platform DB (root)
  └── tenants table → { slug: "gofetch", db_url: "postgresql://..." }
                        ↓
              Neon Branch: gofetch
                ├── app_pages
                ├── page_sections
                ├── navigation_items
                ├── knowledge_snippets
                ├── security_groups
                ├── users
                ├── requests
                ├── orders
                ├── travel_plans
                ├── chat_messages
                ├── reviews
                ├── disputes
                ├── transactions
                └── notifications
```

### Connection Strings

| Type | Pattern | Usage |
|------|---------|-------|
| **Pooled** | `ep-xxx-pooler.neon.tech` | Application queries (connection pooling) |
| **Direct** | `ep-xxx.neon.tech` | Migrations, seed scripts |

### ZenStack Schema

**File**: `website/zenstack/schema.zmodel`

9 models with `@@map()` to existing tables:

```prisma
model User {
  id            String    @id @default(uuid())
  walletAddress String    @unique
  email         String?
  displayName   String?
  avatarUrl     String?
  role          UserRole  @default(BUYER)
  reputation    Float     @default(0)
  // ... timestamps, relations
  @@map("users")
}

model Request {
  id            String    @id @default(uuid())
  buyerId       String
  title         String
  description   String?
  originCity    String
  originCountry String
  destCity      String
  destCountry   String
  category      ItemCategory
  itemDescription String
  itemValue     Float
  offerPrice    Float
  currency      String    @default("USDC")
  status        RequestStatus @default(PENDING)
  // ... timestamps, relations
  @@map("requests")
}

// ... Order, TravelPlan, ChatMessage, Review, Dispute, Transaction, Notification
```

8 enums: `UserRole`, `RequestStatus`, `OrderStatus`, `ItemCategory`, `TravelStatus`, `PaymentStatus`, `DisputeStatus`, `TransactionType`

---

## 7. Phase 5: Vercel Deployment

### Deploy Service

**File**: `tokenizmyapp/src/domain/tenant/vercel-deploy-service.ts`

#### Project Creation

```typescript
ensureVercelProject({ slug: "gofetch" })
  → Creates Vercel project with:
    - name: "gofetch"
    - framework: "nextjs"
    - gitRepository: "iliashapiro/GoFetch"
    - buildCommand: TENANT_BUILD_COMMAND
    - installCommand: "bun install"
    - outputDirectory: ".next"
```

#### Env Var Configuration

The deploy service sets these env vars on the Vercel project:

| Variable | Source | Type |
|----------|--------|------|
| `NEXT_PUBLIC_TENANT_SLUG` | `gofetch` | plain |
| `NEXT_PUBLIC_APP_NAME` | `GoFetch` | plain |
| `NEXT_PUBLIC_PRIMARY_COLOR` | `#2A5A4A` | plain |
| `NEXT_PUBLIC_SECONDARY_COLOR` | `#C97A5E` | plain |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | plain |
| `NEXT_PUBLIC_WEB3_WALLET_ENABLED` | `true` | plain |
| `NEXT_PUBLIC_CRYPTO_PAYMENTS_ENABLED` | `true` | plain |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | from config | plain |
| `POSTGRES_URL` | Neon pooled URL | encrypted |
| `DATABASE_URL` | Neon direct URL | encrypted |
| `JWT_SECRET` | auto-generated | encrypted |
| `GOOGLE_CLIENT_ID` | from config | encrypted |
| `GOOGLE_CLIENT_SECRET` | from config | encrypted |

#### Deployment Trigger

After env vars are set, the service triggers a Vercel deployment via:
- Git push to main branch, OR
- Manual deployment trigger

### Vercel Project Config

**File**: `website/vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "bash scripts/vercel-build.sh",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

---

## 8. Phase 6: Web3 & Social Wallet Integration

### Reown AppKit Configuration

**Files**:
- `website/lib/web3/config.ts` — AppKit config
- `website/lib/web3/wagmi-adapter.ts` — Custom WagmiAdapter for Reown
- `website/lib/web3/provider.tsx` — Web3Provider component

```typescript
// config.ts
export const APPKIT_STATE = {
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chains: [baseSepolia],
  metadata: {
    name: 'GoFetch',
    description: 'P2P Global Shopping & Delivery',
    url: 'https://gofetch.vercel.app',
    icons: ['https://gofetch.vercel.app/icon.png'],
  },
};

// wagmi-adapter.ts — Reown's AppKitWagmiAdapter
export function createGoFetchWagmiAdapter() {
  return new AppKitWagmiAdapter({
    projectId: APPKIT_STATE.projectId,
    chains: APPKIT_STATE.chains,
  });
}
```

### Social Login Flow

```
User clicks "Connect Wallet"
  ↓
AppKit modal opens with:
  ├── Google (social login)
  ├── Apple (social login)
  ├── Email (OTP)
  ├── MetaMask (injected)
  ├── Coinbase Wallet (injected)
  └── WalletConnect (QR)
  ↓
User authenticates (e.g., Google)
  ↓
AppKit returns:
  - walletAddress (EOA)
  - social@email.com
  - idToken
  ↓
SIWE Auth Flow:
  1. POST /api/auth/login { walletAddress, email, signature }
  2. Server verifies SIWE message
  3. Server creates JWT token
  4. Client stores JWT in cookie
  ↓
Authenticated session
```

### SIWE Authentication

**File**: `website/lib/web3/use-siwe-auth.ts`

```typescript
export function useSiweAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const login = async () => {
    // 1. Get nonce from server
    const { nonce } = await fetch('/api/auth/nonce').then(r => r.json());

    // 2. Create SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in to GoFetch',
      uri: window.location.origin,
      version: '1',
      chainId: 84532,
      nonce,
    });

    // 3. Sign message
    const signature = await signMessageAsync({ message: message.prepareMessage() });

    // 4. Verify on server
    const { token } = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ message: message.prepareMessage(), signature }),
    }).then(r => r.json());

    // 5. Store JWT
    document.cookie = `token=${token}; path=/`;
  };

  return { login, logout, isAuthenticated };
}
```

### Smart Contract Integration

**File**: `website/lib/web3/contracts.ts`

```typescript
export const GOFETCH_CONTRACT = {
  address: '0x...', // Deployed on Base Sepolia
  abi: EscrowABI,
  chainId: 84532,
};

export async function createEscrow(orderId: string, amount: bigint) {
  // Create escrow for order
}

export async function releaseEscrow(orderId: string) {
  // Release funds to traveler after confirmation
}

export async function refundEscrow(orderId: string) {
  // Refund buyer on dispute
}
```

---

## 9. Phase 7: Post-Deployment Configuration

### 9.1: Verify Deployment

1. Open `https://gofetch.vercel.app`
2. Check homepage loads with Sage Green + Terracotta theme
3. Navigate through all pages (Explore, Orders, Trips, etc.)
4. Verify bottom nav on mobile, sidebar on desktop

### 9.2: Configure Google OAuth

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials for `gofetch.vercel.app`
3. Add redirect URIs:
   - `https://gofetch.vercel.app/api/auth/callback/google`
4. Update env vars on Vercel:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### 9.3: Configure Reown AppKit

1. Go to Reown Dashboard
2. Create project for `gofetch.vercel.app`
3. Copy project ID
4. Update env var: `NEXT_PUBLIC_REOWN_PROJECT_ID`

### 9.4: Deploy Smart Contract

1. Deploy `Escrow.sol` to Base Sepolia
2. Update contract address in `website/lib/web3/contracts.ts`
3. Fund contract with USDC for initial escrows

### 9.5: Seed Initial Data

Run seed script to populate:
- Categories (Electronics, Fashion, Food, etc.)
- Sample delivery requests
- Sample traveler profiles
- Knowledge snippets for AI assistant

---

## 10. Phase 8: Development & Customization

### Local Development

```bash
# Clone the GoFetch repo
git clone https://github.com/iliashapiro/GoFetch.git
cd GoFetch/website

# Install dependencies
npm install

# Set up env vars
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
# → http://localhost:3000
```

### Key Development Files

| File | Purpose |
|------|---------|
| `website/zenstack/schema.zmodel` | Database schema (9 models) |
| `website/app/(app)/` | Dashboard pages |
| `website/app/api/` | API routes |
| `website/lib/web3/` | Web3/wallet integration |
| `website/components/` | Reusable UI components |
| `website/redux/store.ts` | State management |
| `website/domain/tenant/tenant-config.ts` | Multi-tenant config |

### Customization Points

1. **Branding**: Update colors in `tailwind.config.ts` and `template-catalog.ts`
2. **Pages**: Add/modify pages in `app/(app)/`
3. **API Routes**: Add endpoints in `app/api/`
4. **Components**: Create reusable components in `components/`
5. **Schema**: Extend ZenStack models in `zenstack/schema.zmodel`
6. **Knowledge**: Add AI assistant context in `knowledge_snippets` table

### Testing

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 11. Key Files & References

### TokenizMyApp Platform

| File | Purpose |
|------|---------|
| `tokenizmyapp/src/domain/tenant/template-catalog.ts` | Template definitions (GoFetch = line 604) |
| `tokenizmyapp/src/components/ops-admin/tenant-wizard.tsx` | Create tenant wizard (8 steps) |
| `tokenizmyapp/src/domain/app-pack/app-pack-generator.ts` | AI schema generation |
| `tokenizmyapp/src/domain/app-pack/app-pack-materializer.ts` | Persist packs to DB |
| `tokenizmyapp/src/domain/tenant/vercel-deploy-service.ts` | Vercel project creation |
| `tokenizmyapp/src/components/layout/app-shell.tsx` | Responsive layout (sidebar/bottom nav) |

### GoFetch App

| File | Purpose |
|------|---------|
| `website/zenstack/schema.zmodel` | GoFetch database schema |
| `website/tsconfig.json` | TypeScript config (strict mode) |
| `website/tailwind.config.ts` | Design system colors |
| `website/redux/store.ts` | Redux store (5 slices) |
| `website/lib/web3/config.ts` | Reown AppKit config |
| `website/lib/web3/wagmi-adapter.ts` | Wagmi adapter for Reown |
| `website/lib/web3/use-siwe-auth.ts` | SIWE authentication hook |
| `website/lib/web3/contracts.ts` | Smart contract interfaces |
| `website/app/(app)/explore/page.tsx` | Browse requests page |
| `website/app/(app)/orders/page.tsx` | My orders page |
| `website/app/(app)/trips/page.tsx` | Travel plans page |
| `website/app/(app)/wallet/page.tsx` | Wallet & payments page |
| `website/app/(app)/chat/page.tsx` | Messages page |
| `website/app/api/auth/login/route.ts` | JWT login endpoint |
| `website/app/api/requests/route.ts` | Requests API |
| `website/app/api/orders/route.ts` | Orders API |
| `website/domain/tenant/tenant-config.ts` | Multi-tenant config |
| `website/vercel.json` | Vercel deployment config |

### Documentation

| File | Purpose |
|------|---------|
| `NEXTJS_MIGRATION_GUIDE.md` | Full migration reference |
| `ARCHITECTURE_ANALYSIS.md` | Current system deep dive |
| `QUICK_REFERENCE.md` | Quick architecture lookup |
| `website/DEPLOYMENT.md` | Deployment documentation |

---

## 12. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Template not found | Ensure `delivery-marketplace` exists in `template-catalog.ts` |
| Neon provisioning fails | Check `NEON_API_KEY` is set and valid |
| Vercel deploy fails | Verify Git repo is linked and `VERCEL_TOKEN` is valid |
| Wallet connection fails | Check `REOWN_PROJECT_ID` and chain ID (84532) |
| Auth redirect fails | Verify Google OAuth redirect URIs include callback URL |
| Build fails | Run `npm run type-check` to find TypeScript errors |

### Logs & Debugging

```bash
# Vercel deployment logs
vercel logs gofetch.vercel.app

# Neon query logs
SELECT * FROM neon_stat_activity WHERE database_name = 'gofetch';

# Local development
npm run dev -- --debug
```

### Rollback

If deployment fails:
1. Go to Vercel dashboard → GoFetch project → Deployments
2. Find last successful deployment
3. Click "Promote to Production"

Or via CLI:
```bash
vercel rollback gofetch.vercel.app
```

---

## Summary

The GoFetch delivery marketplace is built through the TokenizMyApp factory platform:

1. **Platform Admin** → 8-step wizard creates tenant with template, DB, and deployment
2. **Template** → `delivery-marketplace` provides pre-configured pages, nav, Web3, and AI assistant
3. **AI Pipeline** → Decomposes requirements into W3C-aligned schema and app definitions
4. **Neon DB** → Per-tenant isolated branch with ZenStack/Prisma schema
5. **Vercel** → Git-linked project with auto-deployment on push
6. **Web3** → Reown AppKit social wallet + Base Sepolia USDC escrow
7. **Post-Deploy** → OAuth, contract deployment, data seeding

The entire flow is automated through the Platform Admin wizard — from business description to live deployment in minutes.

---

*Last updated: September 1, 2026*
*Platform: TokenizMyApp v1.0*
*Template: delivery-marketplace (builtin)*
