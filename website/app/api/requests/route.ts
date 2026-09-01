import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const where: any = { status: "open" };
    if (category && category !== "All") where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        buyer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[requests GET]", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, itemPrice, maxItemPrice, reward, fromCountry, fromCity, toCountry, toCity, deadline } = body;

    if (!title || !itemPrice || !reward || !fromCountry || !fromCity || !toCountry || !toCity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const request = await prisma.request.create({
      data: {
        tenantSlug: "default",
        buyerId: session.userId,
        title,
        description: description || null,
        category: category || "Other",
        itemPrice: parseFloat(itemPrice),
        maxItemPrice: maxItemPrice ? parseFloat(maxItemPrice) : null,
        reward: parseFloat(reward),
        fromCountry,
        fromCity,
        toCountry,
        toCity,
        deadline: deadline ? new Date(deadline) : null,
        status: "open",
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("[requests POST]", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
