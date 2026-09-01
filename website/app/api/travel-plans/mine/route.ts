import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const plans = await prisma.travelPlan.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[travel-plans/mine]", error);
    return NextResponse.json({ error: "Failed to fetch travel plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const plan = await prisma.travelPlan.create({
      data: {
        userId: session.userId,
        fromCity: body.fromCity,
        fromCountry: body.fromCountry,
        toCity: body.toCity,
        toCountry: body.toCountry,
        departDate: body.departDate,
        returnDate: body.returnDate,
        capacity: body.capacity || 1,
        note: body.note,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("[travel-plans/mine POST]", error);
    return NextResponse.json({ error: "Failed to create travel plan" }, { status: 500 });
  }
}
