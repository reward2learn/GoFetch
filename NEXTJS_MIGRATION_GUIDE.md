# TrustMule Next.js Migration Guide

**Version:** 1.0  
**Target Stack:** Next.js 15 + TypeScript + Neon PostgreSQL + Redux + Tailwind CSS  
**Estimated Timeline:** 8–12 weeks (depending on team size)

---

## Quick Reference: Current vs. Target

| Aspect | Current | Target | Migration Notes |
| -------- | --------- | -------- | --- |
| **Frontend** | Expo/React Native | Next.js 15 (React Web) | Full rewrite of mobile UI; desktop-responsive design |
| **Routing** | expo-router | Next.js App Router | 1:1 file structure mapping |
| **State** | Context + useState | Redux Toolkit | Centralized + DevTools |
| **Backend** | FastAPI (Python) | Next.js API Routes | TypeScript everywhere; co-locate frontend+backend |
| **Database** | MongoDB | Neon PostgreSQL | Relational schema; better for escrow state |
| **Storage** | Emergent Object Storage | Vercel Blob or AWS S3 | Simpler integration |
| **Styling** | React Native StyleSheet | Tailwind CSS + CSS Modules | Web-native approach |
| **Deployment** | Emergent | Vercel + Neon | Native Next.js + serverless DB |

---

## Phase 1: Project Setup (Week 1)

### 1.1 Initialize Next.js Project

```bash
# Create Next.js 15 project with TypeScript
npx create-next-app@latest trustmule-nextjs \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd trustmule-nextjs
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install \
  react@19 \
  react-dom@19 \
  next@15 \
  typescript@latest

# Redux + state management
npm install \
  @reduxjs/toolkit \
  react-redux \
  redux-persist

# Database + ORM
npm install \
  @neondatabase/serverless \
  postgres \
  drizzle-orm \
  drizzle-kit

# API + auth
npm install \
  jsonwebtoken \
  jose \
  bcryptjs

# Web3
npm install \
  wagmi \
  viem \
  @reown/appkit-react-web \
  @reown/appkit-wagmi \
  @tanstack/react-query

# UI & utilities
npm install \
  clsx \
  tailwind-merge \
  date-fns \
  uuid \
  react-hook-form \
  zod

# Dev dependencies
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  @types/jsonwebtoken \
  tailwindcss \
  postcss \
  autoprefixer \
  @tailwindcss/typography \
  eslint \
  eslint-config-next \
  prettier
```

### 1.3 Setup Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# Neon PostgreSQL
NEON_DATABASE_URL=postgresql://user:password@db.neon.tech/trustmule

# JWT
JWT_SECRET=your_jwt_secret_here

# Storage (Vercel Blob or AWS S3)
BLOB_STORE_URL=blob://your-blob-store
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1

# Web3
NEXT_PUBLIC_REOWN_PROJECT_ID=621b8dd9dc79db93bc918431c10c1764
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME=Base Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_ESCROW_ADDRESS=0x...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### 1.4 Configure TypeScript

```jsonc
// tsconfig.json
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
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", ".next"]
}
```

### 1.5 Configure Tailwind CSS

```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design system colors (from design_guidelines.json)
        brand: {
          50: "#e8f1ed",
          100: "#d1e3db",
          300: "#2A5A4A",
          primary: "#2A5A4A",
        },
        secondary: {
          300: "#C97A5E",
        },
        surface: {
          0: "#FCFBFA",
          1: "#FFFFFF",
          tertiary: "#F2F0ED",
        },
      },
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
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
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Phase 2: Database & ORM Setup (Week 2)

### 2.1 Initialize Neon PostgreSQL

```bash
# Create project in Neon console: https://console.neon.tech
# Copy connection string to .env.local as NEON_DATABASE_URL
```

### 2.2 Setup Drizzle ORM

```bash
# Initialize Drizzle
npm run drizzle-kit studio
# (or configure in package.json scripts)
```

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL is not defined");
}

const client = postgres(connectionString);
export const db = drizzle(client);
```

### 2.3 Define Database Schema

```typescript
// db/schema.ts
import { pgTable, uuid, varchar, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: text("bio"),
  walletAddress: varchar("wallet_address", { length: 255 }),
  kycStatus: varchar("kyc_status", { length: 50 }).default("unverified"),
  reputation: numeric("reputation", { precision: 3, scale: 2 }).default("0"),
  reviewsCount: integer("reviews_count").default(0),
  ordersCompleted: integer("orders_completed").default(0),
  tripsCompleted: integer("trips_completed").default(0),
  usdcBalance: numeric("usdc_balance", { precision: 20, scale: 6 }).default("0"),
  lockedBalance: numeric("locked_balance", { precision: 20, scale: 6 }).default("0"),
  token: varchar("token", { length: 255 }).unique(),
  acceptedTermsAt: timestamp("accepted_terms_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Requests table
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  imageUrl: varchar("image_url", { length: 500 }),
  itemPrice: numeric("item_price", { precision: 20, scale: 2 }),
  maxItemPrice: numeric("max_item_price", { precision: 20, scale: 2 }),
  reward: numeric("reward", { precision: 20, scale: 2 }),
  fromCountry: varchar("from_country", { length: 100 }),
  fromCity: varchar("from_city", { length: 100 }),
  toCountry: varchar("to_country", { length: 100 }),
  toCity: varchar("to_city", { length: 100 }),
  deadline: timestamp("deadline"),
  status: varchar("status", { length: 50 }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").references(() => requests.id),
  buyerId: uuid("buyer_id").references(() => users.id),
  travelerId: uuid("traveler_id").references(() => users.id),
  itemPrice: numeric("item_price", { precision: 20, scale: 2 }),
  reward: numeric("reward", { precision: 20, scale: 2 }),
  proposedFee: numeric("proposed_fee", { precision: 20, scale: 2 }),
  serviceFee: numeric("service_fee", { precision: 20, scale: 2 }),
  stake: numeric("stake", { precision: 20, scale: 2 }),
  platformFeePct: numeric("platform_fee_pct", { precision: 3, scale: 2 }),
  platformFee: numeric("platform_fee", { precision: 20, scale: 2 }).default("0"),
  payout: numeric("payout", { precision: 20, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("offered"),
  buyerFunded: boolean("buyer_funded").default(false),
  travelerStaked: boolean("traveler_staked").default(false),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  receiptHash: varchar("receipt_hash", { length: 255 }),
  qrHash: varchar("qr_hash", { length: 255 }),
  note: text("note"),
  timeline: text("timeline").default("[]"), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel Plans table
export const travelPlans = pgTable("travel_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  fromCountry: varchar("from_country", { length: 100 }),
  fromCity: varchar("from_city", { length: 100 }),
  toCountry: varchar("to_country", { length: 100 }),
  toCity: varchar("to_city", { length: 100 }),
  departDate: varchar("depart_date", { length: 10 }),
  returnDate: varchar("return_date", { length: 10 }),
  note: text("note"),
  capacity: integer("capacity").default(1),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  senderId: uuid("sender_id").references(() => users.id),
  text: text("text"),
  imageUrl: varchar("image_url", { length: 500 }),
  readBy: text("read_by").default("[]"), // JSON array of UUIDs
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  revieweeId: uuid("reviewee_id").references(() => users.id),
  rating: integer("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Disputes table
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id),
  initiatorId: uuid("initiator_id").references(() => users.id),
  reason: text("reason"),
  evidence: text("evidence").default("[]"), // JSON array of paths
  status: varchar("status", { length: 50 }).default("open"),
  resolution: varchar("resolution", { length: 50 }),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }),
  amount: numeric("amount", { precision: 20, scale: 6 }),
  orderId: uuid("order_id").references(() => orders.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }),
  title: varchar("title", { length: 255 }),
  body: text("body"),
  requestId: uuid("request_id").references(() => requests.id),
  planId: uuid("plan_id").references(() => travelPlans.id),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2.4 Run Migrations

```bash
# Create migration files
npm run drizzle-kit generate:pg

# Apply migrations
npm run drizzle-kit migrate:pg
```

---

## Phase 3: Redux Store Setup (Week 2)

### 3.1 Create Redux Store

```typescript
// redux/store.ts
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

### 3.2 Create Redux Slices

```typescript
// redux/slices/auth.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
  kycStatus: "unverified" | "verified";
  reputation: number;
  reviewsCount: number;
  ordersCompleted: number;
  tripsCompleted: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const login = createAsyncThunk(
  "auth/login",
  async ({ name, email, acceptedTerms }: { name: string; email: string; acceptedTerms: boolean }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, acceptedTerms }),
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    localStorage.setItem("token", data.token);
    return data;
  }
);

export const refreshAuth = createAsyncThunk("auth/refresh", async () => {
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("Refresh failed");
  return res.json();
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  } as AuthState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(refreshAuth.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

```typescript
// redux/slices/orders.slice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface Order {
  id: string;
  requestId: string;
  buyerId: string;
  travelerId: string | null;
  status: string;
  itemPrice: number;
  reward: number;
  serviceFee: number;
  [key: string]: any;
}

interface OrdersState {
  orders: Order[];
  myOrders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
}

export const fetchOrders = createAsyncThunk("orders/fetchOrders", async () => {
  const res = await fetch("/api/orders", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
});

export const fetchMyOrders = createAsyncThunk("orders/fetchMyOrders", async () => {
  const res = await fetch("/api/orders/mine", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("Failed to fetch my orders");
  return res.json();
});

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    myOrders: [],
    selectedOrder: null,
    loading: false,
    error: null,
  } as OrdersState,
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.myOrders = action.payload;
        state.loading = false;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch orders";
      });
  },
});

export const { setSelectedOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
```

### 3.3 Create Redux Hooks

```typescript
// redux/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Phase 4: Backend API Routes (Week 3–4)

### 4.1 Auth Routes

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const { name, email, acceptedTerms } = await req.json();

  if (!email || !name) {
    return NextResponse.json({ error: "Email and name required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (!user) {
    const newUser = {
      id: uuid(),
      name: name.trim(),
      email: normalizedEmail,
      walletAddress: `0x${Math.random().toString(16).slice(2)}`,
      acceptedTermsAt: acceptedTerms ? new Date().toISOString() : null,
    };

    const result = await db.insert(users).values(newUser).returning();
    user = result[0];
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      kycStatus: user.kycStatus,
      reputation: user.reputation,
      reviewsCount: user.reviewsCount,
      ordersCompleted: user.ordersCompleted,
      tripsCompleted: user.tripsCompleted,
    },
  });
}
```

### 4.2 Requests Routes

```typescript
// app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requests, users } from "@/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get("category");
  const toCountry = searchParams.get("toCountry");
  const q = searchParams.get("q");

  let where = eq(requests.status, "open");
  if (category && category !== "All") {
    where = and(where, eq(requests.category, category));
  }
  if (toCountry) {
    where = and(where, eq(requests.toCountry, toCountry));
  }
  if (q) {
    where = and(where, like(requests.title, `%${q}%`));
  }

  const data = await db
    .select()
    .from(requests)
    .where(where)
    .orderBy(desc(requests.createdAt))
    .limit(200);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  const body = await req.json();

  const newRequest = {
    id: uuid(),
    buyerId: user.id,
    ...body,
    status: "open",
    createdAt: new Date(),
  };

  const result = await db.insert(requests).values(newRequest).returning();
  return NextResponse.json(result[0]);
}
```

### 4.3 Orders Routes

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, requests, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);

  const userOrders = await db
    .select()
    .from(orders)
    .where(or(eq(orders.buyerId, user.id), eq(orders.travelerId, user.id)));

  return NextResponse.json(userOrders);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  const { requestId, proposedFee, note } = await req.json();

  // Fetch request
  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.buyerId === user.id) {
    return NextResponse.json(
      { error: "Cannot accept your own request" },
      { status: 400 }
    );
  }

  // Create order
  const newOrder = {
    id: uuid(),
    requestId,
    buyerId: request.buyerId,
    travelerId: user.id,
    itemPrice: request.itemPrice,
    reward: request.reward,
    proposedFee,
    serviceFee: proposedFee,
    stake: request.itemPrice * 0.15,
    status: "offered",
    note,
  };

  const result = await db.insert(orders).values(newOrder).returning();
  return NextResponse.json(result[0]);
}
```

### 4.4 Authentication Middleware

```typescript
// lib/auth.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Not authenticated");
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch {
    throw new Error("Invalid token");
  }
}
```

---

## Phase 5: Frontend Pages & Components (Week 5–7)

### 5.1 Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustMule - Global Shopping & Delivery",
  description: "Buy from anywhere, delivered by travelers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 5.2 Providers (Redux + Persist)

```typescript
// app/providers.tsx
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

### 5.3 Protected App Layout

```typescript
// app/(app)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { refreshAuth } from "@/redux/slices/auth.slice";
import { AppNavbar } from "@/components/layouts/AppNavbar";
import { AppSidebar } from "@/components/layouts/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!loading && !user) {
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(refreshAuth());
      } else {
        router.push("/login");
      }
    }
  }, [loading, user, router, dispatch]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-surface-0">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <AppNavbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

### 5.4 Explore Page

```typescript
// app/(app)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { fetchRequests } from "@/redux/slices/requests.slice";
import { RequestGrid } from "@/components/marketplace/RequestGrid";
import { Button } from "@/components/ui/Button";

export default function ExplorePage() {
  const [category, setCategory] = useState("All");
  const [destination, setDestination] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "All") params.append("category", category);
      if (destination) params.append("toCountry", destination);
      if (search) params.append("q", search);

      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      setRequests(data);
      setLoading(false);
    };

    fetchData();
  }, [category, destination, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold">Explore Requests</h1>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-md"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-border rounded-md"
          >
            <option>All</option>
            <option>Beauty</option>
            <option>Electronics</option>
            <option>Fashion</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <RequestGrid requests={requests} />
      )}
    </div>
  );
}
```

### 5.5 Order Detail Page

```typescript
// app/(app)/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderActions } from "@/components/orders/OrderActions";

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-extrabold">Order {params.id}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <OrderTimeline order={order} />
        </div>

        {/* Actions */}
        <div>
          <OrderActions order={order} />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Component System (Week 5–7)

### 6.1 UI Primitives

```typescript
// components/ui/Button.tsx
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "font-semibold rounded-lg transition-all flex items-center gap-2 justify-center";
  const variantClasses = {
    primary: "bg-brand-primary text-white hover:bg-brand-600 disabled:opacity-50",
    secondary: "bg-secondary-300 text-white hover:bg-secondary-400",
    outline: "border-2 border-brand-primary text-brand-primary hover:bg-brand-50",
    ghost: "text-brand-primary hover:bg-brand-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading ? "..." : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
```

```typescript
// components/ui/Card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-1 rounded-lg border border-border shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

### 6.2 Complex Components

```typescript
// components/marketplace/RequestCard.tsx
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency } from "@/lib/utils";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    image: string;
    fromCountry: string;
    toCountry: string;
    reward: number;
    buyer: { name: string; id: string };
  };
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Link href={`/request/${request.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
        <div className="relative h-40 mb-4">
          <Image
            src={request.image}
            alt={request.title}
            fill
            className="object-cover rounded"
          />
          <div className="absolute top-2 right-2 bg-secondary-300 text-white px-3 py-1 rounded-full text-sm font-bold">
            +{formatCurrency(request.reward)}
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{request.title}</h3>
        <p className="text-sm text-muted mb-3">
          {request.fromCountry} → {request.toCountry}
        </p>
        <div className="flex items-center gap-2">
          <Avatar name={request.buyer.name} size="sm" />
          <span className="text-sm">{request.buyer.name}</span>
        </div>
      </Card>
    </Link>
  );
}
```

---

## Phase 7: Web3 Integration (Week 8)

### 7.1 Wagmi Setup

```typescript
// lib/web3/wagmi-config.ts
import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});
```

### 7.2 Web3 Actions

```typescript
// app/api/orders/[id]/fund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ESCROW_ABI } from "@/lib/web3/abi";
import { publicClient, walletClient } from "@/lib/web3/clients";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  const { txHash } = await req.json();

  // Verify transaction on-chain
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  if (!receipt) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 400 });
  }

  // Update order status in DB
  // ...

  return NextResponse.json({ success: true });
}
```

---

## Phase 8: Testing & Deployment (Week 9–12)

### 8.1 Test Database Queries

```typescript
// __tests__/db/users.test.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Users", () => {
  it("should create and fetch a user", async () => {
    const newUser = {
      id: "test-123",
      email: "test@example.com",
      name: "Test User",
    };

    await db.insert(users).values(newUser);
    const fetched = await db.query.users.findFirst({
      where: eq(users.email, "test@example.com"),
    });

    expect(fetched?.name).toBe("Test User");
  });
});
```

### 8.2 Test API Routes

```typescript
// __tests__/api/auth.test.ts
import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

describe("Auth API", () => {
  it("should login a user", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        acceptedTerms: true,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.token).toBeDefined();
    expect(data.user.email).toBe("john@example.com");
  });
});
```

### 8.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Configure environment variables in Vercel dashboard
# NEON_DATABASE_URL, JWT_SECRET, etc.

# Deploy
vercel --prod
```

---

## Migration Checklist

### Completeness Verification

- [ ] All 11 screens converted to Next.js pages
- [ ] All 60+ API endpoints implemented
- [ ] Redux slices cover all state needs
- [ ] Database schema mirrors MongoDB collections
- [ ] UI component library ported to React + Tailwind
- [ ] Authentication flow works end-to-end
- [ ] Web3 integration functional on testnet
- [ ] E2E tests pass (Cypress or Playwright)
- [ ] Lighthouse score ≥ 85
- [ ] Production build optimized (< 200KB JS)

### Performance Targets

- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.5s

---

## Rollback Strategy

If issues arise during migration:

1. **Hybrid Approach:** Run both Expo and Next.js in parallel (API gateway routes to both)
2. **Blue-Green Deployment:** Keep old system live while testing new one
3. **Feature Flags:** Use feature flags to gradually roll out Next.js UI
4. **Database:** PostgreSQL replicates from MongoDB during transition

---

## Key Differences to Communicate

- **No Mobile Native App:** Next.js is web-only (PWA possible as alternative)
- **Styling System:** Tailwind CSS vs React Native StyleSheet
- **Navigation:** URL-based routing vs native stack navigation
- **Web3:** Wagmi (web) replaces Reown AppKit (mobile-only)
- **Deployment:** Vercel + Neon replaces Emergent serverless

---

**For support, refer to the comprehensive ARCHITECTURE_ANALYSIS.md document and the current codebase as the source of truth.**
