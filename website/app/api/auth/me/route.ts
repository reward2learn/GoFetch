import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const walletAddr = session.walletAddress?.toLowerCase();

      // Upsert: create user if missing (login fallback may not have created a DB record)
      const user = await prisma.user.upsert({
        where: { walletAddress: walletAddr },
        update: {}, // no-op update, just ensure record exists
        create: {
          walletAddress: walletAddr,
          name: `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`,
          email: `${walletAddr.slice(0, 10)}@wallet.local`,
          token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        },
        select: { id: true, name: true, email: true, walletAddress: true, role: true, avatarUrl: true, acceptedTermsAt: true, createdAt: true },
      });

      return NextResponse.json(user);
    } catch (dbError) {
      // DB down — return JWT payload as fallback so the app still works
      console.error("[auth/me] DB error, returning JWT fallback:", dbError);
      return NextResponse.json({
        id: session.userId,
        walletAddress: session.walletAddress,
        name: `${session.walletAddress.slice(0, 6)}...${session.walletAddress.slice(-4)}`,
        email: `${session.walletAddress.slice(0, 10)}@wallet.local`,
        role: "buyer",
        avatarUrl: null,
        acceptedTermsAt: null,
        createdAt: null,
      });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
