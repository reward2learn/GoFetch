import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const userTransactions = await prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json(userTransactions);
  } catch (error) {
    console.error("[wallet/transactions]", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
