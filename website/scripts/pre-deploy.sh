#!/bin/bash
set -e

echo "🚀 GoFetch Pre-Deploy (local build → Vercel)"
echo "============================================="

# 1. Generate Prisma client
echo ""
echo "📦 Step 1/3: Generating Prisma client..."
npx prisma generate --schema=zenstack/prisma/schema.prisma

# 2. Build for Vercel production locally (produces .vercel/output/)
echo ""
echo "🔨 Step 2/3: Building locally for production..."
vercel build --prod --yes

# 3. Deploy pre-built output (no remote build)
echo ""
echo "🚀 Step 3/3: Deploying pre-built files to Vercel..."
vercel deploy --prebuilt --prod --yes

echo ""
echo "✅ Pre-deploy complete! No remote build needed."
