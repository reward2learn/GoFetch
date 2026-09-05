import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        request: true,
        buyer: {
          select: { id: true, name: true, walletAddress: true, avatarUrl: true },
        },
        traveler: {
          select: { id: true, name: true, walletAddress: true, avatarUrl: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only buyer or traveler can view the order
    if (order.buyerId !== session.userId && order.travelerId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[deliveries/:id]", error);
    return NextResponse.json({ error: "Failed to fetch delivery" }, { status: 500 });
  }
}

// Allowed status transitions for the traveler
const TRAVELER_STATUS_FLOW = [
  "agreed",
  "funded",
  "purchased",
  "in_transit",
  "arrived",
  "handoff_pending",
  "completed",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, confirmDelivery } = body;

    // ── BUYER CONFIRM DELIVERY ──
    if (confirmDelivery && order.buyerId === session.userId) {
      // Only allowed when order is in handoff_pending or arrived status
      if (order.status !== "handoff_pending" && order.status !== "arrived") {
        return NextResponse.json(
          { error: `Cannot confirm delivery in "${order.status}" status` },
          { status: 400 }
        );
      }

      const itemPrice = parseFloat(order.itemPrice.toString());
      const reward = parseFloat(order.reward.toString());
      const total = itemPrice + reward;
      const platformFeePct = parseFloat(order.platformFeePct?.toString() || "0.10");
      const platformFee = total * platformFeePct;
      const travelerPayout = total - platformFee;

      // Update order to completed
      const timelineEntry = {
        status: "completed",
        timestamp: new Date().toISOString(),
        actorId: session.userId,
        note: "Buyer confirmed receipt — funds released",
      };

      const updated = await prisma.order.update({
        where: { id: params.id },
        data: {
          status: "completed",
          platformFee,
          payout: travelerPayout,
          timeline: [...((order.timeline as any[]) || []), timelineEntry],
        },
      });

      // Credit traveler's balance
      if (order.travelerId) {
        await prisma.user.update({
          where: { id: order.travelerId },
          data: {
            usdcBalance: { increment: travelerPayout },
            ordersCompleted: { increment: 1 },
          },
        });

        // Record settlement transaction for traveler
        await prisma.transaction.create({
          data: {
            userId: order.travelerId,
            type: "escrow_release",
            amount: travelerPayout,
            orderId: order.id,
            note: `Delivery confirmed — payout (after ${platformFeePct * 100}% platform fee)`,
          },
        });
      }

      // Record platform fee transaction
      if (platformFee > 0) {
        await prisma.transaction.create({
          data: {
            userId: order.buyerId,
            type: "service_fee",
            amount: platformFee,
            orderId: order.id,
            note: `Platform fee (${platformFeePct * 100}%)`,
          },
        });
      }

      return NextResponse.json(updated);
    }

    // ── TRAVELER STATUS UPDATE ──
    // Only the traveler can update status
    if (order.travelerId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate the status transition
    const currentIdx = TRAVELER_STATUS_FLOW.indexOf(order.status as typeof TRAVELER_STATUS_FLOW[number]);
    const newIdx = TRAVELER_STATUS_FLOW.indexOf(status as typeof TRAVELER_STATUS_FLOW[number]);

    if (currentIdx === -1 || newIdx === -1) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Allow moving forward one step at a time (or staying)
    if (newIdx !== currentIdx + 1 && newIdx !== currentIdx) {
      return NextResponse.json(
        { error: `Cannot jump from "${order.status}" to "${status}". Must advance one step at a time.` },
        { status: 400 }
      );
    }

    // Build timeline entry
    const timelineEntry = {
      status,
      timestamp: new Date().toISOString(),
      actorId: session.userId,
    };

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: status as typeof TRAVELER_STATUS_FLOW[number],
        timeline: [...((order.timeline as any[]) || []), timelineEntry],
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[deliveries PATCH]", error);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
