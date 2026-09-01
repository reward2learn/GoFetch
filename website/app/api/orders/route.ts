import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userOrders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: session.userId },
          { travelerId: session.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        request: {
          select: { title: true, description: true, fromCity: true, toCity: true, category: true },
        },
      },
    });

    const enriched = userOrders.map((order) => ({
      ...order,
      role: order.buyerId === session.userId ? "buyer" : "traveler",
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, itemPrice, reward } = body;

    if (!requestId || !itemPrice) {
      return NextResponse.json({ error: "requestId and itemPrice are required" }, { status: 400 });
    }

    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (request.status !== "open") return NextResponse.json({ error: "Request no longer available" }, { status: 400 });
    if (request.buyerId === session.userId) return NextResponse.json({ error: "Cannot accept your own request" }, { status: 400 });

    const result = await prisma.order.create({
      data: {
        requestId,
        buyerId: request.buyerId,
        travelerId: session.userId,
        itemPrice,
        reward: reward || request.reward,
        status: "agreed",
      },
    });

    await prisma.request.update({
      where: { id: requestId },
      data: { status: "in_progress" },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
