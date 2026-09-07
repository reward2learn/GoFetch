#!/bin/bash
# Disk cleanup script for GoFetch project
# Prevents "SQLiteError: database disk is full" by maintaining adequate free space
# Run with: bash scripts/cleanup-disk.sh
# Or set up a cron job: 0 3 * * * bash /path/to/GoFetch/GoFetchApp/scripts/cleanup-disk.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HOME_DIR="$HOME"

echo "=== GoFetch Disk Cleanup ==="
echo "Date: $(date)"
echo ""

# Check current disk space
echo "--- Disk Space Before ---"
df -h /Users/iliashapiro/GoFetch | tail -1 | awk '{print "Available:", $4}'
echo ""

# 1. Clean bun install cache (can be re-downloaded)
if [ -d "$HOME_DIR/.bun/install/cache" ]; then
    CACHE_SIZE=$(du -sh "$HOME_DIR/.bun/install/cache" 2>/dev/null | cut -f1)
    echo "Cleaning bun install cache ($CACHE_SIZE)..."
    rm -rf "$HOME_DIR/.bun/install/cache"
    echo "  Done."
fi

# 2. Clean Yarn cache
if [ -d "$HOME_DIR/Library/Caches/Yarn" ]; then
    echo "Cleaning Yarn cache..."
    rm -rf "$HOME_DIR/Library/Caches/Yarn"/*
    echo "  Done."
fi

# 3. Clean hardhat-nodejs cache
if [ -d "$HOME_DIR/Library/Caches/hardhat-nodejs" ]; then
    echo "Cleaning hardhat-nodejs cache..."
    rm -rf "$HOME_DIR/Library/Caches/hardhat-nodejs"/*
    echo "  Done."
fi

# 4. Clean typescript cache
if [ -d "$HOME_DIR/Library/Caches/typescript" ]; then
    echo "Cleaning typescript cache..."
    rm -rf "$HOME_DIR/Library/Caches/typescript"/*
    echo "  Done."
fi

# 5. Truncate large log files (keep last 10MB)
for logfile in "$PROJECT_ROOT/.opencode/opencode-rag.log"; do
    if [ -f "$logfile" ]; then
        SIZE=$(du -sh "$logfile" 2>/dev/null | cut -f1)
        echo "Truncating $logfile ($SIZE)..."
        > "$logfile"
        echo "  Done."
    fi
done

# 6. Clean .opencode/node_modules if it exists (redundant with project node_modules)
if [ -d "$PROJECT_ROOT/.opencode/node_modules" ]; then
    echo "Cleaning .opencode/node_modules..."
    rm -rf "$PROJECT_ROOT/.opencode/node_modules"
    echo "  Done."
fi

# 7. Clean old .next and .turbo build artifacts
for dir in "$PROJECT_ROOT/website/.next" "$PROJECT_ROOT/frontend/.next" "$PROJECT_ROOT/website/.turbo" "$PROJECT_ROOT/frontend/.turbo"; do
    if [ -d "$dir" ]; then
        echo "Removing $dir..."
        rm -rf "$dir"
        echo "  Done."
    fi
done

echo ""
echo "--- Disk Space After ---"
df -h /Users/iliashapiro/GoFetch | tail -1 | awk '{print "Available:", $4}'
echo ""
echo "=== Cleanup Complete ==="
