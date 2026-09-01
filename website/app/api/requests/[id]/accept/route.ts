import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "open") {
      return NextResponse.json({ error: "Request is no longer open" }, { status: 400 });
    }

    if (request.buyerId === session.userId) {
      return NextResponse.json({ error: "Cannot accept your own request" }, { status: 400 });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        tenantSlug: "default",
        requestId: id,
        travelerId: session.userId,
        buyerId: request.buyerId,
        status: "accepted",
        itemPrice: request.itemPrice,
        reward: request.reward,
      },
    });

    // Update request status
    await prisma.request.update({
      where: { id },
      data: { status: "accepted" },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[requests/accept]", error);
    return NextResponse.json({ error: "Failed to accept request" }, { status: 500 });
  }
}
