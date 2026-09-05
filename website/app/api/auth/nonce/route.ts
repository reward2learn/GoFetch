import { NextRequest, NextResponse } from "next/server";
import { storeNonce } from "@/lib/siwe";

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

    const normalizedAddress = address.toLowerCase();
    const nonce = generateNonce();
    const expiresAt = Date.now() + NONCE_TTL_MS;
    
    // Store nonce using shared siwe module
    storeNonce(normalizedAddress, nonce, expiresAt);

    console.log(`[nonce] Generated nonce for ${normalizedAddress.slice(0, 10)}...`);
    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("[nonce POST]", error);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
