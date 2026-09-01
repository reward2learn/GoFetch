# GoFetch Deployment Guide

## Prerequisites

1. **Vercel Account** - https://vercel.com
2. **Neon Database** - https://neon.tech
3. **Reown Project** - https://reown.com

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `POSTGRES_URL` | Neon PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown AppKit project ID | ✅ |
| `NEXT_PUBLIC_RPC_URL` | Base Sepolia RPC endpoint | ✅ |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC contract address | ✅ |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | Escrow contract address | ✅ |

## Deployment Steps

### 1. Connect Repository

1. Go to Vercel Dashboard → New Project
2. Import your Git repository
3. Select the `website` directory as root
4. Click "Deploy"

### 2. Configure Environment

1. Go to Project → Settings → Environment Variables
2. Add all required variables from `.env.example`
3. Click "Save"

### 3. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Multi-Tenant Deployment

For multi-tenant deployments:

1. Set `NEXT_PUBLIC_TENANT_SLUG` per tenant
2. Create separate Vercel projects per tenant
3. Use `DATABASE_URL_<SLUG>` for tenant-specific databases

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking (optional)
- **Neon Dashboard**: Database metrics

## Troubleshooting

### Build Fails

```bash
# Check TypeScript errors
npm run type-check

# Check lint errors
npm run lint

# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Connection Issues

```bash
# Push schema changes
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

### Web3 Connection Issues

1. Verify `NEXT_PUBLIC_REOWN_PROJECT_ID` is correct
2. Check wallet is on Base Sepolia network
3. Ensure RPC URL is accessible
