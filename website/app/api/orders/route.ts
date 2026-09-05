import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    // Fetch orders where user is buyer or traveler
    const [userOrders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [
            { buyerId: session.userId },
            { travelerId: session.userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          status: true,
          itemPrice: true,
          reward: true,
          createdAt: true,
          buyerId: true,
          request: {
            select: { title: true, category: true, imageUrl: true, fromCity: true, fromCountry: true, toCity: true, toCountry: true, deliveryType: true, pickupLocation: true },
          },
        },
      }),
      prisma.order.count({
        where: {
          OR: [
            { buyerId: session.userId },
            { travelerId: session.userId },
          ],
        },
      }),
    ]);

    // Fetch user's own requests (as buyer) that don't have an order yet
    const userRequests = await prisma.request.findMany({
      where: {
        buyerId: session.userId,
        status: { in: ["open", "in_progress"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        itemPrice: true,
        reward: true,
        fromCity: true,
        fromCountry: true,
        toCity: true,
        toCountry: true,
        deliveryType: true,
        pickupLocation: true,
        pickupInstructions: true,
        createdAt: true,
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
      category: order.request?.category || "Other",
      imageUrl: order.request?.imageUrl || null,
      fromCity: order.request?.fromCity || "",
      fromCountry: order.request?.fromCountry || "",
      toCity: order.request?.toCity || "",
      toCountry: order.request?.toCountry || "",
      deliveryType: order.request?.deliveryType || "standard",
      pickupLocation: order.request?.pickupLocation || null,
    }));

    // Normalize pending requests as "waiting for traveler" items
    const normalizedRequests = userRequests
      .filter((r) => r.orders.length === 0)
      .map((req) => ({
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
        fromCountry: req.fromCountry || "",
        toCity: req.toCity || "",
        toCountry: req.toCountry || "",
        deliveryType: req.deliveryType || "standard",
        pickupLocation: req.pickupLocation || null,
        pickupInstructions: req.pickupInstructions || null,
      }));

    // Combine and sort by date
    const combined = [...normalizedOrders, ...normalizedRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      orders: combined,
      pagination: {
        page,
        limit,
        total: totalOrders + normalizedRequests.length,
        totalPages: Math.ceil((totalOrders + normalizedRequests.length) / limit),
      },
    });
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
        platformFeePct: 0.10,
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
