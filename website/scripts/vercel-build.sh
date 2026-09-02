#!/bin/bash
set -e

echo "🚀 Starting GoFetch build..."

# Create empty .env if missing (Next.js stat() fails without it on Vercel)
if [ ! -f .env ]; then
  touch .env
  echo "📄 Created empty .env placeholder"
fi

# 1. Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# 2. Build Next.js app
echo "🔨 Building Next.js app..."
npm run build

echo "✅ Build complete!"
