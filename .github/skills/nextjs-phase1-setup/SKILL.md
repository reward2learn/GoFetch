---
name: nextjs-phase1-setup
description: >
  **WORKFLOW SKILL** — Scaffold and configure a Next.js 15 project from scratch with TypeScript, Redux, Tailwind CSS, and design system tokens.
  Use when: setting up a new Next.js project; bootstrapping with Redux state management; configuring Tailwind with custom design system; 
  creating auth middleware; migrating from React Native or other frameworks to Next.js; need to replicate TrustMule's tech stack.
  Includes: Next.js initialization, dependency installation with peer conflict resolution, environment configuration, 
  Redux store setup, Tailwind design system tokens, TypeScript strict mode, auth utilities, database config, and login page scaffold.
  Output: Production-ready Next.js project with Redux, Tailwind, auth middleware, and structured for scaling.
---

# Next.js Phase 1: Project Setup & Configuration

**Workflow Type:** Multi-step initialization and configuration  
**Scope:** Workspace (team-shared setup for TrustMule migration)  
**Estimated Time:** 30–45 minutes  
**Prerequisites:** Node.js 18+, npm 9+

---

## Overview

This skill scaffolds a production-ready Next.js 15 project with the complete TrustMule tech stack:
- **Framework:** Next.js 15 + React 19 + TypeScript (strict mode)
- **State:** Redux Toolkit + redux-persist
- **Styling:** Tailwind CSS with design system tokens
- **Auth:** JWT-based middleware
- **Database:** Drizzle ORM + PostgreSQL (Neon)
- **Web3:** wagmi + Reown AppKit
- **Deployment:** Vercel-ready

### What Gets Created

✅ Next.js project scaffold with App Router  
✅ Redux store with 5 slices (auth, orders, requests, wallet, ui)  
✅ TypeScript configuration (strict mode, path aliases)  
✅ Tailwind CSS with TrustMule design system (colors, spacing, radius, shadows)  
✅ Environment variables template  
✅ Authentication middleware + JWT utilities  
✅ Database configuration (Drizzle + PostgreSQL)  
✅ Providers component (Redux + persist gate)  
✅ Protected layout structure  
✅ Login page scaffold  

---

## Step-by-Step Workflow

### Step 1: Initialize Next.js Project

```bash
cd /path/to/workspace
npx create-next-app@latest trustmule-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --skip-install
```

**Key Flags:**
- `--typescript` — Strict TypeScript throughout
- `--tailwind` — Tailwind CSS included
- `--app` — App Router (not Pages Router)
- `--no-src-dir` — Files at root level (flatter structure)
- `--import-alias "@/*"` — Use `@/` for imports

**Expected Output:**
```
Success! Created trustmule-nextjs at /path/to/workspace/trustmule-nextjs
```

---

### Step 2: Install Dependencies

Navigate to the project and install packages:

```bash
cd trustmule-nextjs
npm install
```

Then install additional libraries:

```bash
npm install --force \
  @reduxjs/toolkit \
  react-redux \
  redux-persist \
  @neondatabase/serverless \
  postgres \
  drizzle-orm \
  drizzle-kit \
  jsonwebtoken \
  jose \
  bcryptjs \
  wagmi \
  viem \
  @reown/appkit-react-web \
  @reown/appkit-wagmi \
  @tanstack/react-query \
  clsx \
  tailwind-merge \
  date-fns \
  uuid \
  react-hook-form \
  zod
```

**Troubleshooting Peer Dependency Conflicts:**
- If you see `ERESOLVE` errors, use `--force` or `--legacy-peer-deps`
- Root cause: `@reown/appkit-wagmi` and `wagmi` have conflicting `@coinbase/wallet-sdk` versions
- Both flags are acceptable for this tech stack

---

### Step 3: Setup Environment Variables

Create `.env.local` in project root:

```bash
# .env.local
# Application
NEXT_PUBLIC_APP_NAME=TrustMule
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database (Neon PostgreSQL)
NEON_DATABASE_URL=postgresql://user:password@db.neon.tech/trustmule

# Authentication
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRY=30d

# Web3
NEXT_PUBLIC_REOWN_PROJECT_ID=621b8dd9dc79db93bc918431c10c1764
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME=Base Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000

# Storage
BLOB_STORE_URL=blob://your-blob-store
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
```

**Note:** Use `NEXT_PUBLIC_` prefix for environment variables exposed to browser (Web3, chain config). Omit for server-only secrets (JWT_SECRET, database URL).

---

### Step 4: Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

**Key Settings:**
- `strict: true` — Full type checking
- `noUnusedLocals/Parameters` — Catch dead code
- `baseUrl + paths` — `@/` imports work everywhere

---

### Step 5: Configure Tailwind with Design System

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f1ed",
          300: "#2A5A4A",
          primary: "#2A5A4A",
        },
        secondary: {
          300: "#C97A5E",
        },
        success: {
          300: "#30825B",
        },
        warning: {
          300: "#F29C38",
        },
        error: {
          300: "#D94436",
        },
        surface: {
          0: "#FCFBFA",
          1: "#FFFFFF",
          tertiary: "#F2F0ED",
        },
        text: {
          primary: "#1C1C1E",
          secondary: "#6C6C70",
        },
        border: "#E5E5EA",
        muted: "#8E8E93",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        pill: "9999px",
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        soft: "0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

**Design System Tokens Included:**
- **Colors:** Brand (Sage Green #2A5A4A), Secondary (Terracotta #C97A5E), status colors
- **Spacing:** xs (4px) through 3xl (48px) — 7 scale levels
- **Radius:** sm (6px), md (12px), lg (20px), pill (999px)
- **Typography:** Plus Jakarta Sans font family
- **Shadows:** Card and soft variants for depth

---

### Step 6: Setup Redux Store

Create Redux directory structure and files:

#### `redux/store.ts`
```typescript
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/auth.slice";
import ordersReducer from "./slices/orders.slice";
import requestsReducer from "./slices/requests.slice";
import walletReducer from "./slices/wallet.slice";
import uiReducer from "./slices/ui.slice";

const persistConfig = {
  key: "trustmule",
  storage,
  whitelist: ["auth", "wallet"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    orders: ordersReducer,
    requests: requestsReducer,
    wallet: walletReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### `redux/hooks.ts`
```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

#### Redux Slices
Create 5 slices in `redux/slices/`:
1. **auth.slice.ts** — User, token, login/logout, refresh
2. **orders.slice.ts** — My orders, order detail, status tracking
3. **requests.slice.ts** — Marketplace requests, filters, search
4. **wallet.slice.ts** — Balance, locked funds, transaction history
5. **ui.slice.ts** — Active tab, modals, filters, loading states

[Full slice templates provided in referenced NEXTJS_MIGRATION_GUIDE.md]

---

### Step 7: Create Auth Utilities

Create `lib/auth.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function verifyAuth(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRY || "30d",
  });
}
```

---

### Step 8: Setup Database Configuration

Create `db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DATABASE_URL is not defined");
}

const client = postgres(connectionString);
export const db = drizzle(client);
```

**Next:** Define schema in `db/schema.ts` using Drizzle pgTable definitions (see NEXTJS_MIGRATION_GUIDE.md Phase 2).

---

### Step 9: Create Providers Component

Create `app/providers.tsx`:

```typescript
"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
```

---

### Step 10: Update Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustMule - Global Shopping & Delivery",
  description: "Buy from anywhere, delivered by travelers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface-0">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### Step 11: Create Landing/Redirect Page

Update `app/page.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/app/explore");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-0">
      <p className="text-muted">Loading...</p>
    </div>
  );
}
```

---

### Step 12: Create Login Page

Create `app/login/page.tsx` with form handling Redux auth thunk.

[Full template in NEXTJS_MIGRATION_GUIDE.md]

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Peer dependency conflicts on `@wagmi/connectors`** | Use `npm install --force` to override peer checks. Safe for this tech stack. |
| **`Cannot find module '@reduxjs/toolkit'`** | Ensure `npm install` completed successfully and `node_modules` folder exists. Run `npm ci` to reinstall. |
| **Tailwind classes not applying** | Verify `content` array in `tailwind.config.ts` includes all template files. Run `npm run build` to check. |
| **TypeScript errors on Redux hooks** | Ensure `strict: true` in `tsconfig.json`. Types generated from store.ts will flow through hooks. |
| **`.env.local` not loading** | Restart dev server after creating `.env.local`. Next.js loads env vars at build time. |

---

## Verification Checklist

After completing all steps:

- [ ] Next.js project created and dependencies installed
- [ ] `.env.local` configured with placeholder values
- [ ] `tsconfig.json` strict mode enabled, path alias working
- [ ] `tailwind.config.ts` has design system colors and spacing
- [ ] `redux/store.ts` created with 5 slices
- [ ] `lib/auth.ts` utilities for JWT verification and generation
- [ ] `db/index.ts` Drizzle connection configured
- [ ] `app/providers.tsx` wraps Redux + PersistGate
- [ ] `app/layout.tsx` uses Providers component
- [ ] `app/page.tsx` redirects authenticated users to `/app/explore`
- [ ] `app/login/page.tsx` renders login form

**Quick Test:**
```bash
npm run dev
# Visit http://localhost:3000
# Should redirect to /login (since no auth token)
# Form should render without errors
```

---

## Next Steps (Phase 2 & Beyond)

After Phase 1 setup:

1. **Phase 2 — Database & ORM** (Week 2)
   - Create Neon PostgreSQL project
   - Define schema in `db/schema.ts`
   - Run migrations with `drizzle-kit`

2. **Phase 3 — Backend API Routes** (Weeks 3–4)
   - Create `/api/auth/login` endpoint
   - Create `/api/requests`, `/api/orders` endpoints
   - Implement auth middleware

3. **Phase 4 — Frontend Pages & Components** (Weeks 5–7)
   - Build page structure: `/app/(app)/explore`, `/app/(app)/orders`, etc.
   - Port UI components from Expo to React + Tailwind

4. **Phase 5 — Web3 Integration** (Week 8)
   - Setup wagmi configuration
   - Implement USDC escrow contract calls

5. **Phase 6 — Testing & Deployment** (Weeks 9–12)
   - E2E tests (Cypress or Playwright)
   - Deploy to Vercel

---

## Related Documentation

- **Full Migration Guide:** `NEXTJS_MIGRATION_GUIDE.md` in project root
- **Architecture Analysis:** `ARCHITECTURE_ANALYSIS.md` (current system deep dive)
- **Quick Reference:** `QUICK_REFERENCE.md` (API endpoints, DB schema, design system)

---

## Suggested Follow-ups

Once this skill is saved, consider creating:

1. **`nextjs-phase2-database`** — Neon + Drizzle schema + migrations
2. **`nextjs-phase3-api-routes`** — Auth and order endpoints
3. **`nextjs-component-system`** — Reusable UI primitives (Button, Card, Avatar, etc.)
4. **`web3-wagmi-integration`** — Escrow contract setup and on-chain calls
5. **`nextjs-testing-setup`** — Jest + React Testing Library + E2E tests

