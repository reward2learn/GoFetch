import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const request = await prisma.request.findUnique({
      where: { id: params.id },
      include: {
        buyer: {
          select: { id: true, name: true, walletAddress: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[requests/:id]", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;

    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.buyerId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (request.status !== "open") {
      return NextResponse.json({ error: "Can only edit open requests" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, category, itemPrice, maxItemPrice, reward, fromCountry, fromCity, toCountry, toCity, deadline } = body;

    const updated = await prisma.request.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(category !== undefined && { category }),
        ...(itemPrice !== undefined && { itemPrice: parseFloat(itemPrice) }),
        ...(maxItemPrice !== undefined && { maxItemPrice: maxItemPrice ? parseFloat(maxItemPrice) : null }),
        ...(reward !== undefined && { reward: parseFloat(reward) }),
        ...(fromCountry !== undefined && { fromCountry }),
        ...(fromCity !== undefined && { fromCity }),
        ...(toCountry !== undefined && { toCountry }),
        ...(toCity !== undefined && { toCity }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[requests PUT]", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: { orders: { where: { status: { notIn: ["cancelled", "refunded"] } } } },
    });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.buyerId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (request.status !== "open") {
      return NextResponse.json({ error: "Can only delete open requests" }, { status: 400 });
    }

    if (request.orders.length > 0) {
      return NextResponse.json({ error: "Cannot delete request with active orders. Cancel it instead." }, { status: 400 });
    }

    await prisma.request.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[requests DELETE]", error);
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
