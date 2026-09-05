import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const walletAddr = session.walletAddress?.toLowerCase();

      // Upsert: create user if missing (login fallback may not have created a DB record),
      // then set acceptedTermsAt.
      const user = await prisma.user.upsert({
        where: { walletAddress: walletAddr },
        update: { acceptedTermsAt: new Date() },
        create: {
          walletAddress: walletAddr,
          name: `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`,
          email: `${walletAddr.slice(0, 10)}@wallet.local`,
          token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          acceptedTermsAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        acceptedAt: user.acceptedTermsAt,
      });
    } catch (dbError) {
      console.error("[accept-terms] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save terms acceptance" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to accept terms:", error);
    return NextResponse.json(
      { error: "Failed to accept terms" },
      { status: 500 }
    );
  }
}
