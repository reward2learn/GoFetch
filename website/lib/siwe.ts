/**
 * SIWE (Sign-In with Ethereum) message validation
 */

// In-memory nonce store (same as in nonce route)
const nonces = new Map<string, { nonce: string; expiresAt: number; address: string }>();

/**
 * Validate a SIWE message format and nonce
 */
export async function validateSiweMessage(
  message: string,
  expectedAddress: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Parse the SIWE message format
    const lines = message.split("\n");
    
    // Basic format check: should have at least 7 lines
    if (lines.length < 7) {
      return { valid: false, error: "Invalid SIWE message format" };
    }

    // Line 0: "{domain} wants you to sign in with your Ethereum account:"
    if (!lines[0].includes("wants you to sign in with your Ethereum account:")) {
      return { valid: false, error: "Invalid SIWE message header" };
    }

    // Line 1: address
    const addressLine = lines[1]?.trim();
    if (!addressLine || !/^0x[a-fA-F0-9]{40}$/.test(addressLine)) {
      return { valid: false, error: "Invalid address in SIWE message" };
    }

    // Verify address matches
    if (addressLine.toLowerCase() !== expectedAddress.toLowerCase()) {
      return { valid: false, error: "Address mismatch" };
    }

    // Line 2: empty line
    if (lines[2]?.trim() !== "") {
      return { valid: false, error: "Invalid SIWE message format" };
    }

    // Line 3: statement (e.g., "Sign in to GoFetch")
    const statement = lines[3]?.trim();
    if (!statement) {
      return { valid: false, error: "Missing statement in SIWE message" };
    }

    // Line 4: empty line
    if (lines[4]?.trim() !== "") {
      return { valid: false, error: "Invalid SIWE message format" };
    }

    // Parse remaining lines for fields
    const fields: Record<string, string> = {};
    for (let i = 5; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      fields[key] = value;
    }

    // Validate required fields
    if (fields["URI"] !== "https://gofetch.app") {
      return { valid: false, error: "Invalid URI in SIWE message" };
    }

    if (fields["Version"] !== "1") {
      return { valid: false, error: "Invalid version in SIWE message" };
    }

    if (fields["Chain ID"] !== "11155111") {
      return { valid: false, error: "Invalid chain ID in SIWE message" };
    }

    // Validate nonce
    const nonce = fields["Nonce"];
    if (!nonce) {
      return { valid: false, error: "Missing nonce in SIWE message" };
    }

    // Check if nonce exists and is valid
    const storedNonce = nonces.get(expectedAddress.toLowerCase());
    if (!storedNonce) {
      return { valid: false, error: "Nonce not found. Please request a new one." };
    }

    if (storedNonce.expiresAt < Date.now()) {
      nonces.delete(expectedAddress.toLowerCase());
      return { valid: false, error: "Nonce expired. Please request a new one." };
    }

    if (storedNonce.nonce !== nonce) {
      return { valid: false, error: "Invalid nonce" };
    }

    // Nonce is valid, delete it (one-time use)
    nonces.delete(expectedAddress.toLowerCase());

    // Validate "Issued At" field
    if (!fields["Issued At"]) {
      return { valid: false, error: "Missing Issued At in SIWE message" };
    }

    // Optional: Check if Issued At is recent (within last 5 minutes)
    const issuedAt = new Date(fields["Issued At"]);
    const now = new Date();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (Math.abs(now.getTime() - issuedAt.getTime()) > fiveMinutesMs) {
      return { valid: false, error: "SIWE message too old. Please try again." };
    }

    return { valid: true };
  } catch (error) {
    console.error("[validateSiweMessage]", error);
    return { valid: false, error: "Failed to validate SIWE message" };
  }
}

/**
 * Store a nonce for validation (called from the nonce endpoint)
 */
export function storeNonce(address: string, nonce: string, expiresAt: number): void {
  nonces.set(address.toLowerCase(), { nonce, expiresAt, address: address.toLowerCase() });
}

/**
 * Get a stored nonce
 */
export function getStoredNonce(address: string): { nonce: string; expiresAt: number } | undefined {
  return nonces.get(address.toLowerCase());
}
