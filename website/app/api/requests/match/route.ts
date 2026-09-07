import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromCountry = searchParams.get("fromCountry") || "";
    const fromCity = searchParams.get("fromCity") || "";
    const toCountry = searchParams.get("toCountry") || "";
    const toCity = searchParams.get("toCity") || "";
    const departDate = searchParams.get("departDate") || "";
    const returnDate = searchParams.get("returnDate") || "";

    // Require at least a from or to country to consider it a match
    if (!fromCountry && !toCountry) {
      return NextResponse.json([]);
    }

    const where: any = { status: "open" };

    // Match by origin (where the traveler is flying from)
    if (fromCountry) {
      where.fromCountry = { contains: fromCountry, mode: "insensitive" };
    }
    if (fromCity) {
      // Combine with origin country filter via AND
      where.fromCity = { contains: fromCity, mode: "insensitive" };
    }

    // Match by destination (where the buyer wants delivery)
    if (toCountry) {
      where.toCountry = { contains: toCountry, mode: "insensitive" };
    }
    if (toCity) {
      where.toCity = { contains: toCity, mode: "insensitive" };
    }

    // Date range filter: request deadline must fall within the trip's window
    // so the traveler can actually pick up + deliver in time.
    if (departDate || returnDate) {
      const deadlineFilter: any = {};
      if (departDate) {
        // Deadline must be on or after the departure date
        deadlineFilter.gte = new Date(departDate);
      }
      if (returnDate) {
        // Deadline must be on or before the return date
        deadlineFilter.lte = new Date(returnDate);
      }
      // Only apply if we have at least one bound
      if (Object.keys(deadlineFilter).length > 0) {
        where.deadline = deadlineFilter;
      }
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        buyer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[requests/match]", error);
    return NextResponse.json({ error: "Failed to fetch matching requests" }, { status: 500 });
  }
}
