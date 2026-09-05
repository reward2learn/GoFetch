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
    const body = await req.json();
    const { travelPlanId } = body;

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

    // Validate travel plan if provided
    if (travelPlanId) {
      const plan = await prisma.travelPlan.findUnique({ where: { id: travelPlanId } });

      if (!plan) {
        return NextResponse.json({ error: "Travel plan not found" }, { status: 404 });
      }

      if (plan.userId !== session.userId) {
        return NextResponse.json({ error: "Travel plan does not belong to you" }, { status: 403 });
      }

      if (plan.status !== "active") {
        return NextResponse.json({ error: "Travel plan is not active" }, { status: 400 });
      }

      // Validate destination match
      const destMatch =
        (plan.toCity === request.toCity) ||
        (plan.toCountry === request.toCountry && (!request.toCity || request.toCity === "TBD"));

      if (!destMatch) {
        return NextResponse.json({
          error: `Travel plan destination (${plan.toCity}, ${plan.toCountry}) doesn't match request destination (${request.toCity}, ${request.toCountry})`
        }, { status: 400 });
      }

      // Validate date range
      if (request.deadline) {
        const deadline = new Date(request.deadline);
        const depart = new Date(plan.departDate);
        const returnDate = plan.returnDate ? new Date(plan.returnDate) : null;

        if (deadline < depart) {
          return NextResponse.json({
            error: `Request deadline (${deadline.toLocaleDateString()}) is before your departure date (${depart.toLocaleDateString()})`
          }, { status: 400 });
        }

        if (returnDate && deadline > returnDate) {
          return NextResponse.json({
            error: `Request deadline (${deadline.toLocaleDateString()}) is after your return date (${returnDate.toLocaleDateString()})`
          }, { status: 400 });
        }
      }
    }

    // Create order — status "agreed" means both parties committed
    // traveler accepted the request, buyer posted it (implied agreement)
    const order = await prisma.order.create({
      data: {
        tenantSlug: "default",
        requestId: id,
        travelerId: session.userId,
        buyerId: request.buyerId,
        status: "agreed",
        itemPrice: request.itemPrice,
        reward: request.reward,
        platformFeePct: 0.10,
      },
    });

    // Update request status
    await prisma.request.update({
      where: { id },
      data: { status: "in_progress" },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[requests/accept]", error);
    return NextResponse.json({ error: "Failed to accept request" }, { status: 500 });
  }
}
