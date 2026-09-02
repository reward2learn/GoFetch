import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch orders where user is buyer or traveler
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
          select: { title: true, description: true, fromCity: true, toCity: true, category: true, imageUrl: true, productUrl: true, deliveryType: true, pickupLocation: true, pickupInstructions: true },
        },
      },
    });

    // Fetch user's own requests (as buyer) that don't have an order yet
    const userRequests = await prisma.request.findMany({
      where: {
        buyerId: session.userId,
        status: { in: ["open", "in_progress"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        orders: { select: { id: true } },
      },
    });

    // Filter requests that have no order yet (still waiting for a traveler)
    const pendingRequests = userRequests.filter((r) => r.orders.length === 0);

    // Normalize orders
    const normalizedOrders = userOrders.map((order) => ({
      id: order.id,
      type: "order" as const,
      status: order.status,
      itemPrice: order.itemPrice,
      reward: order.reward,
      createdAt: order.createdAt,
      role: order.buyerId === session.userId ? "buyer" : "traveler",
      title: order.request?.title || `Order #${order.id.slice(0, 8)}`,
      description: order.request?.description || "",
      category: order.request?.category || "Other",
      imageUrl: order.request?.imageUrl || null,
      fromCity: order.request?.fromCity || "",
      toCity: order.request?.toCity || "",
      request: order.request,
    }));

    // Normalize pending requests as "waiting for traveler" items
    const normalizedRequests = pendingRequests.map((req) => ({
      id: req.id,
      type: "request" as const,
      status: "open",
      itemPrice: req.itemPrice,
      reward: req.reward,
      createdAt: req.createdAt,
      role: "buyer" as const,
      title: req.title,
      description: req.description || "",
      category: req.category || "Other",
      imageUrl: req.imageUrl || null,
      fromCity: req.fromCity || "",
      toCity: req.toCity || "",
      request: { title: req.title, description: req.description, category: req.category, imageUrl: req.imageUrl, fromCity: req.fromCity, toCity: req.toCity, deliveryType: req.deliveryType, pickupLocation: req.pickupLocation, pickupInstructions: req.pickupInstructions },
    }));

    // Combine and sort by date
    const combined = [...normalizedOrders, ...normalizedRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(combined);
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
