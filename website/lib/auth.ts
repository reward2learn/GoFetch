import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

export interface UserPayload {
  userId: string;
  walletAddress: string;
  role?: string;
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  // 1. Try cookie first
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) {
    const session = await verifyToken(token);
    if (session) return session;
  }

  // 2. Fallback to Authorization header
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7);
    return verifyToken(bearerToken);
  }

  return null;
}

import prisma from "@/db";

/** Check if a wallet address is blacklisted. Returns true if the user
 *  is blacklisted and should be denied access to the application. */
export async function isBlacklistedUser(walletAddress: string | null | undefined): Promise<boolean> {
  if (!walletAddress) return false;
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: { isBlacklisted: true },
    });
    return user?.isBlacklisted ?? false;
  } catch {
    return false;
  }
}
