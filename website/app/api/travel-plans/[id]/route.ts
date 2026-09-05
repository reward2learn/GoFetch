import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await prisma.travelPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Travel plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch travel plan" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.travelPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Travel plan not found" }, { status: 404 });
    }

    if (plan.userId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { fromCountry, fromCity, toCountry, toCity, departDate, returnDate, capacity, note, status } = body;

    const updated = await prisma.travelPlan.update({
      where: { id },
      data: {
        ...(fromCountry !== undefined && { fromCountry }),
        ...(fromCity !== undefined && { fromCity }),
        ...(toCountry !== undefined && { toCountry }),
        ...(toCity !== undefined && { toCity }),
        ...(departDate !== undefined && { departDate: new Date(departDate) }),
        ...(returnDate !== undefined && { returnDate: returnDate ? new Date(returnDate) : null }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(note !== undefined && { note }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[travel-plans PUT]", error);
    return NextResponse.json({ error: "Failed to update travel plan" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.travelPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Travel plan not found" }, { status: 404 });
    }

    if (plan.userId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.travelPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[travel-plans DELETE]", error);
    return NextResponse.json({ error: "Failed to delete travel plan" }, { status: 500 });
  }
}
