import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { fromCountry, fromCity, toCountry, toCity, departDate, returnDate, capacity, notes } = body;

    if (!fromCountry || !fromCity || !toCountry || !toCity) {
      return NextResponse.json({ error: "From/To country and city are required" }, { status: 400 });
    }

    const travelPlan = await prisma.travelPlan.create({
      data: {
        tenantSlug: "default",
        travelerId: session.userId,
        fromCountry,
        fromCity,
        toCountry,
        toCity,
        departDate: departDate ? new Date(departDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
        capacity: capacity || 5,
        notes: notes || null,
        status: "active",
      },
    });

    return NextResponse.json(travelPlan, { status: 201 });
  } catch (error) {
    console.error("[travel-plans POST]", error);
    return NextResponse.json({ error: "Failed to create travel plan" }, { status: 500 });
  }
}
