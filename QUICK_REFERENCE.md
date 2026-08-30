# TrustMule Tech Stack Transition — Quick Reference

**Generated:** 2026-08-30  
**Project:** TrustMule (P2P Global Marketplace with Smart Contract Escrow)

---

## 📋 Document Index

| Document | Purpose | Audience |
| ---------- | --------- | ---------- |
| [ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md) | Deep technical analysis of current system; UX/UI flows; component hierarchy | Architects, Senior Developers |
| [NEXTJS_MIGRATION_GUIDE.md](NEXTJS_MIGRATION_GUIDE.md) | Step-by-step implementation guide for Next.js migration | Dev Teams, Tech Leads |
| **This File** | Quick lookup for architecture, commands, key concepts | Everyone |

---

## 🎯 Current Architecture at a Glance

### Tech Stack

``` code

Frontend:  Expo 54 (React Native) + expo-router
Backend:   FastAPI (Python 3.10) + MongoDB (motor async)
Storage:   Emergent Object Storage API
Web3:      Solidity (Base Sepolia, ready to deploy)
Auth:      Passwordless JWT tokens
State:     React Context + useState
``` code

### Directory Tree (Key Files)

``` code
frontend/
├── app/                    # Expo Router navigation
│   ├── _layout.tsx        # Root (GestureHandler, SafeArea, AuthProvider)
│   ├── (tabs)/_layout.tsx # Bottom tab navigation
│   ├── explore.tsx        # Marketplace feed (2-column grid)
│   ├── trips.tsx          # Travel plans + inbox
│   ├── orders.tsx         # My orders with filter
│   ├── profile.tsx        # User profile + KYC
│   ├── order/[id].tsx     # Order tracking + timeline
│   ├── request/[id].tsx   # Request detail + accept
│   ├── post.tsx           # Create request (modal)
│   ├── travel-plan.tsx    # Create travel plan (modal)
│   ├── qr/[id].tsx        # QR show/generation
│   ├── scan/[id].tsx      # QR scanning
│   ├── chat/[id].tsx      # Messaging
│   ├── review/[id].tsx    # Post-order rating
│   ├── dispute/[id].tsx   # Dispute filing
│   └── user/[id].tsx      # Public profile
├── src/
│   ├── api/client.ts      # HTTP client + auth
│   ├── components/ui.tsx  # Reusable UI (Button, Card, Badge, Avatar, etc.)
│   ├── context/AuthContext.tsx
│   ├── theme/theme.ts     # Design tokens
│   └── web3/              # Reown AppKit scaffolded
└── package.json

backend/
├── server.py              # FastAPI app (1000+ lines, monolithic)
├── requirements.txt       # Python deps
├── pytest.ini
├── tests/                 # 35+ E2E tests
└── .env                   # MongoDB URL, Emergent key, etc.
``` code

---

## 🔄 Core Business Logic & Flows

### User Journey: Accept as Traveller

``` code
1. Explore tab → Filter by destination
2. Tap request card → RequestDetail
3. View hero image + reward + buyer info
4. Tap "Accept & Escrow" → Create offer
5. Buyer accepts offer → agreed state
6. Traveller stakes 15% → funded state
7. Buyer funds escrow → purchased state
8. Traveller uploads receipt → in_transit state
9. Traveller arrives → arrived state
10. QR handoff → handoff_pending state
11. Buyer scans QR or enters code → completed
12. Both rate each other
``` code

### Order State Machine (9 Terminal States)

``` code
offered → agreed → funded → purchased → in_transit → arrived → handoff_pending → completed
                     ↓
                 [disputed] → [refunded] OR [released]
                     ↓
                 [cancelled]
``` code

### Design System (Color Palette)

``` code
Primary:    #2A5A4A (Sage Green - Trust)
Secondary:  #C97A5E (Terracotta - Warmth)
Surface:    #FCFBFA (Off-white background)
Text:       #1C1C1E (Dark)
Accent:     #30825B (Success), #F29C38 (Warning), #D94436 (Error)
Fonts:      Plus Jakarta Sans (geometric, modern)
Spacing:    4, 8, 12, 16, 24, 32, 48 (px)
Radius:     6, 12, 20, 999 (pill)
``` code

---

## 🛠 API Endpoints Summary (60+)

### Authentication (2)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Passwordless login/signup |
| GET | `/api/auth/me` | Current user (requires token) |

### Requests (5)

| POST | `/api/requests` | Create request (buyer) |
| GET | `/api/requests` | List open requests (with filters) |
| GET | `/api/requests/mine` | My requests (buyer) |
| GET | `/api/requests/{id}` | Request detail + offers |
| GET | `/api/requests/{id}/availability` | Travellers count |

### Orders (12+)

| POST | `/api/orders/accept` | Traveller submits offer |
| POST | `/api/orders/{id}/respond` | Buyer accepts/rejects |
| POST | `/api/orders/{id}/stake` | Traveller stakes |
| POST | `/api/orders/{id}/fund` | Buyer funds escrow |
| POST | `/api/orders/{id}/purchased` | Upload receipt |
| POST | `/api/orders/{id}/arrived` | Mark arrived |
| POST | `/api/orders/{id}/complete` | Buyer confirms handoff |
| POST | `/api/orders/{id}/handoff-spot` | Set meetup location |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/mine` | My orders |
| GET | `/api/orders/{id}` | Order detail |

### Travel Plans (4)

| POST | `/api/travel-plans` | Create plan |
| GET | `/api/travel-plans/mine` | My plans |
| POST | `/api/travel-plans/{id}/cancel` | Cancel |
| GET | `/api/travel-plans/{id}/matches` | Matching requests |

### Wallet (4)

| GET | `/api/wallet` | Balance + locked funds |
| POST | `/api/wallet/deposit` | Add funds |
| POST | `/api/wallet/withdraw` | Withdraw |
| GET | `/api/wallet/transactions` | TX history |

### Other Routes (Chat, Reviews, Disputes, Notifications, Files, etc.)

[See ARCHITECTURE_ANALYSIS.md for complete list]

---

## 📊 Database Collections (MongoDB → PostgreSQL)

### users

``` code
id (UUID), email*, name, avatar_url, bio, wallet_address, kyc_status,
reputation (decimal), reviews_count, orders_completed, trips_completed,
usdc_balance, locked_balance, token*, accepted_terms_at, created_at
``` code

### requests

``` code
id (UUID), buyer_id*, title, description, category, image_url,
item_price, max_item_price, reward, from_country, from_city,
to_country, to_city, deadline, status, created_at, deleted_at
``` code

### orders

``` code
id (UUID), request_id*, buyer_id*, traveler_id*, status, item_price,
reward, proposed_fee, service_fee, stake, platform_fee_pct, platform_fee,
payout, buyer_funded (bool), traveler_staked (bool), receipt_url,
receipt_hash, qr_hash, note, timeline (JSON), created_at
``` code

### travel_plans

``` code
id (UUID), user_id*, from_country, from_city, to_country, to_city,
depart_date, return_date, note, capacity, status, created_at
``` code

### chat_messages

``` code
id (UUID), order_id*, sender_id*, text, image_url, read_by (JSON array), created_at
``` code

### reviews

``` code
id (UUID), order_id*, reviewer_id*, reviewee_id*, rating (int),
comment (text), created_at
``` code

### disputes

``` code
id (UUID), order_id*, initiator_id*, reason, evidence (JSON array),
status, resolution, resolved_by*, resolved_at, created_at
``` code

### transactions

``` code
id (UUID), user_id*, type (string), amount, order_id*, note, created_at
``` code

### notifications

``` code
id (UUID), user_id*, type, title, body, request_id*, plan_id*, read (bool), created_at
``` code

---

## 🔐 State Management

### Current (React Context + useState)

``` codetypescript
// Global auth state
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

// Per-screen state (e.g., Explore.tsx)
const [items, setItems] = useState<Request[]>([]);
const [cat, setCat] = useState("All");
const [dest, setDest] = useState<string | null>(null);

// Re-fetch on tab focus
useFocusEffect(useCallback(() => load(), [load]));
``` code

### Target (Redux Toolkit)

``` codetypescript
// Slices
- auth (user, token, loading, error)
- orders (orders[], myOrders[], selectedOrder, loading)
- requests (requests[], loading, error)
- wallet (balance, lockedBalance, transactions[])
- ui (activeTab, modalOpen, filters)

// Middleware
- authMiddleware (hydrate on app load)

// Hooks
- useAppDispatch()
- useAppSelector()
- useAuth() [convenience hook]
``` code

---

## 🎨 Component Hierarchy (Current)

``` code
RootLayout
├─ GestureHandlerRootView
├─ SafeAreaProvider
├─ AuthProvider (Context)
│
├─ [unauthenticated]
│  └─ login.tsx (modal)
│
└─ [authenticated]
   ├─ (tabs)/
   │  ├─ explore.tsx
   │  ├─ trips.tsx
   │  ├─ orders.tsx
   │  ├─ wallet.tsx
   │  └─ profile.tsx
   │
   ├─ Modals (Stack)
   │  ├─ post.tsx
   │  ├─ travel-plan.tsx
   │  ├─ request/[id].tsx
   │  ├─ order/[id].tsx
   │  ├─ chat/[id].tsx
   │  ├─ qr/[id].tsx
   │  ├─ scan/[id].tsx
   │  ├─ review/[id].tsx
   │  ├─ dispute/[id].tsx
   │  ├─ kyc.tsx
   │  ├─ user/[id].tsx
   │  └─ legal/*.tsx

Reusable Components (ui.tsx):
├─ AppText (weight, size, color)
├─ Button (variant, loading, icon)
├─ Card (flexible container)
├─ Badge (tone, label, icon)
├─ Avatar (name, size)
├─ EmptyState (icon, title, subtitle)
├─ Divider
└─ LocationPicker (2-step country→city)
``` code

---

## 🌐 Web3 Integration

### Current Status

- **Contract:** `/contracts/USDCEscrow.sol` (scaffolded)
- **Config:** `/frontend/src/web3/config.ts`
- **Provider:** `/frontend/src/web3/AppKitProvider.tsx` (scaffolded)
- **Activation:** Set `EXPO_PUBLIC_ESCROW_ADDRESS` + native build

### On-Chain Lifecycle

``` code
1. Buyer approves USDC to escrow contract
2. Buyer calls createDeal(dealId, itemPrice, reward)
3. Buyer calls deposit(dealId) → funds locked
4. [Order workflow continues...]
5. Traveller calls release(dealId) → funds to traveller
6. [On dispute] Arbitrator calls refund(dealId) → funds to buyer
``` code

### Deal ID = keccak256(orderId)

``` codetypescript
// Frontend
const dealId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(orderId));

// Backend verification
const verified = keccak256(secret + orderId) === on_chain_deal_id;
``` code

---

## 📱 Responsive Design (Current)

### React Native → Web Breakpoints

| Breakpoint | Width | Use Case |
| ----------- | ------- | ---------- |
| Mobile | 360–480 | Default (portrait) |
| Tablet | 768–1024 | iPad, large phones |
| Desktop | 1280+ | Web, desktop web |

### Current Approach

- **Mobile-first:** Default is mobile (Expo simulator)
- **Platform detection:** `Platform.OS === 'web'` for conditionals
- **Layout:** Flex-based, no CSS Grid

### Target (Next.js)

- **Desktop-first or mobile-first Tailwind:** Configure in `tailwind.config.ts`
- **CSS Grid + Flexbox:** Both available
- **Responsive utilities:** `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

---

## 🚀 Deployment & Infrastructure

### Current (Emergent)

``` code
Frontend:  Published via Expo (expo publish / eas build)
Backend:   Emergent serverless (webhook-driven)
Database:  MongoDB (Emergent-managed or external)
Storage:   Emergent Object Storage API
Secrets:   .env files in Emergent dashboard
``` code

### Target (Next.js)

``` code
Frontend:  Vercel (git push → auto-deploy)
Backend:   Vercel Functions (serverless)
Database:  Neon (PostgreSQL serverless)
Storage:   Vercel Blob or AWS S3
Secrets:   Vercel environment variables dashboard
CI/CD:     GitHub Actions (auto-test, deploy on PR merge)
``` code

### Deploy Commands

``` codebash
# Vercel
vercel --prod

# Neon migrations
npm run drizzle-kit migrate:pg

# Database seeding (optional)
npm run seed
``` code

---

## 🔑 Key Configuration Files

### Tailwind (Next.js)

``` codetypescript
// tailwind.config.ts
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { brand: "#2A5A4A", secondary: "#C97A5E", ... },
      spacing: { xs: "4px", sm: "8px", ... },
      borderRadius: { sm: "6px", md: "12px", ... },
    },
  },
}
``` code

### TypeScript

``` codejson
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "preserve",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
``` code

### Redux

``` codetypescript
// redux/store.ts
const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    // ...
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authMiddleware),
});
``` code

---

## ✅ Migration Checklist Summary

**Phase 1 (Week 1):** Setup Next.js, TypeScript, Redux, Tailwind  
**Phase 2 (Week 2):** Neon PostgreSQL, Drizzle ORM, schema migration  
**Phase 3 (Week 3-4):** Backend API routes (auth, requests, orders)  
**Phase 4 (Week 5-7):** Frontend pages + component system  
**Phase 5 (Week 8):** Web3 integration (wagmi + Reown AppKit)  
**Phase 6 (Week 9-12):** Testing, optimization, deployment  

---

## 📈 Performance Targets (Next.js)

| Metric | Target | Tool |
| -------- | -------- | ------ |
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse |
| **FID** (First Input Delay) | < 100ms | Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Core Web Vitals |
| **TTI** (Time to Interactive) | < 3.5s | Lighthouse |
| **JS Bundle Size** | < 200KB (gzipped) | webpack-bundle-analyzer |

---

## 🔄 Rollback Strategy

If migration hits critical issues:

1. **Hybrid Mode:** Both Expo and Next.js run; API gateway routes to both
2. **Feature Flags:** Gradually roll out Next.js UI sections
3. **Database:** Replicate Postgres ← MongoDB during transition
4. **Blue-Green:** Keep Expo live while testing Next.js in shadow traffic

---

## 📞 Common Questions

**Q: Do we need to support both mobile and web?**  
A: Current system is mobile-only (React Native). Target is web (Next.js), with PWA for offline/mobile web. Consider React Native Web as a bridge if native is still required.

**Q: Will we lose all mobile-specific features?**  
A: Features like camera QR scanning, biometric auth can be replaced with web APIs (getUserMedia, WebAuthn).

**Q: How do we handle real-time chat?**  
A: Currently polling; consider upgrading to WebSockets (Socket.io, Supabase Realtime, or Vercel KV for pub/sub).

**Q: Web3 integration timeline?**  
A: Scaffolded in current system; wagmi integration in Phase 5. Can activate post-launch if testnet validation needed first.

**Q: Can we run Expo and Next.js in parallel?**  
A: Yes, API routes can be version-versioned (/api/v1, /api/v2) or feature-flagged for gradual migration.

---

## 🎓 Learning Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Neon PostgreSQL](https://neon.tech/)
- [Vercel Deployment](https://vercel.com/docs)
- [wagmi + Reown AppKit](https://wagmi.sh/)

---

**Last Updated:** 2026-08-30  
**Status:** Ready for implementation  
**Next Step:** Kick off Phase 1 (Project Setup)

For detailed implementation steps, refer to **NEXTJS_MIGRATION_GUIDE.md**.
