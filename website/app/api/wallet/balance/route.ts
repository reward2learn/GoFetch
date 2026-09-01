import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { usdcBalance: true, lockedBalance: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      balance: {
        usdc: user.usdcBalance?.toString() || "0",
        locked: user.lockedBalance?.toString() || "0",
        currency: "USDC",
      },
    });
  } catch (error) {
    console.error("[wallet/balance]", error);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
