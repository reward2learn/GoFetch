import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 1. Fetch user's own requests (as buyer) — include orders to see who accepted
    const ownRequests = await prisma.request.findMany({
      where: { buyerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          include: {
            traveler: {
              select: { id: true, name: true, avatarUrl: true, walletAddress: true },
            },
          },
        },
      },
    });

    // 2. Fetch orders where user is the traveler
    const travelerOrders = await prisma.order.findMany({
      where: { travelerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        request: true,
        buyer: {
          select: { id: true, name: true, avatarUrl: true, walletAddress: true },
        },
      },
    });

    // Normalize own requests
    const normalizedOwn = ownRequests.map((req) => ({
      id: req.id,
      type: "request" as const,
      role: "owner" as const,
      title: req.title,
      description: req.description || "",
      category: req.category || "Other",
      imageUrl: req.imageUrl || null,
      itemPrice: req.itemPrice,
      reward: req.reward,
      status: req.status,
      fromCity: req.fromCity,
      fromCountry: req.fromCountry,
      toCity: req.toCity,
      toCountry: req.toCountry,
      deliveryType: req.deliveryType,
      pickupLocation: req.pickupLocation,
      createdAt: req.createdAt,
      // Travelers who accepted this request
      acceptedBy: req.orders.map((order) => ({
        orderId: order.id,
        travelerId: order.travelerId,
        traveler: order.traveler,
        orderStatus: order.status,
        acceptedAt: order.createdAt,
      })),
      hasAcceptedOrders: req.orders.length > 0,
    }));

    // Normalize traveler orders
    const normalizedTraveler = travelerOrders.map((order) => ({
      id: order.requestId,
      orderId: order.id,
      type: "request" as const,
      role: "traveler" as const,
      title: order.request?.title || `Request #${order.requestId.slice(0, 8)}`,
      description: order.request?.description || "",
      category: order.request?.category || "Other",
      imageUrl: order.request?.imageUrl || null,
      itemPrice: order.itemPrice,
      reward: order.reward,
      status: order.request?.status || "in_progress",
      fromCity: order.request?.fromCity || "",
      fromCountry: order.request?.fromCountry || "",
      toCity: order.request?.toCity || "",
      toCountry: order.request?.toCountry || "",
      deliveryType: order.request?.deliveryType || "standard",
      pickupLocation: order.request?.pickupLocation || null,
      createdAt: order.createdAt,
      buyer: order.buyer,
      orderStatus: order.status,
    }));

    // Combine and sort by date
    const combined = [...normalizedOwn, ...normalizedTraveler].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(combined);
  } catch (error) {
    console.error("[inbox GET]", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
