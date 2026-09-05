import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromCountry = searchParams.get("fromCountry") || "";
    const toCountry = searchParams.get("toCountry") || "";

    if (!fromCountry && !toCountry) {
      return NextResponse.json([]);
    }

    const where: any = { status: "open" };

    // Match by destination (toCountry is most important for delivery)
    if (toCountry) {
      where.toCountry = { contains: toCountry, mode: "insensitive" };
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        buyer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[requests/match]", error);
    return NextResponse.json({ error: "Failed to fetch matching requests" }, { status: 500 });
  }
}
