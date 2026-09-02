import { NextRequest, NextResponse } from "next/server";

// Simple in-memory nonce store (production: use Redis or DB)
const nonces = new Map<string, { nonce: string; expiresAt: number; address: string }>();

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const nonce = generateNonce();
    const expiresAt = Date.now() + NONCE_TTL_MS;
    
    // Store nonce keyed by address
    nonces.set(address.toLowerCase(), { nonce, expiresAt, address: address.toLowerCase() });

    // Clean expired nonces
    for (const [key, val] of nonces.entries()) {
      if (val.expiresAt < Date.now()) nonces.delete(key);
    }

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("[nonce POST]", error);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
