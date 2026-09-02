import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categories = searchParams.get("categories");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest";
    const fromCountry = searchParams.get("fromCountry") || "";
    const toCountry = searchParams.get("toCountry") || "";

    const where: any = { status: "open" };

    // Multi-category filter
    if (categories) {
      const cats = categories.split(",").filter(c => c && c !== "All");
      if (cats.length > 0) {
        where.category = { in: cats };
      }
    }

    // Search filter
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Country filters
    if (fromCountry) {
      where.fromCountry = { contains: fromCountry, mode: "insensitive" };
    }
    if (toCountry) {
      where.toCountry = { contains: toCountry, mode: "insensitive" };
    }

    // Sort
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { itemPrice: "asc" };
        break;
      case "price_desc":
        orderBy = { itemPrice: "desc" };
        break;
      case "reward_asc":
        orderBy = { reward: "asc" };
        break;
      case "reward_desc":
        orderBy = { reward: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy,
      take: 50,
      include: {
        buyer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("[requests GET]", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, imageUrl, productUrl, itemPrice, maxItemPrice, reward, fromCountry, fromCity, toCountry, toCity, deadline, deliveryType, pickupLocation, pickupInstructions } = body;

    if (!title || !itemPrice || !reward || !fromCountry || !fromCity || !toCountry || !toCity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const request = await prisma.request.create({
      data: {
        tenantSlug: "default",
        buyerId: session.userId,
        title,
        description: description || null,
        category: category || "Other",
        imageUrl: imageUrl || null,
        productUrl: productUrl || null,
        itemPrice: parseFloat(itemPrice),
        maxItemPrice: maxItemPrice ? parseFloat(maxItemPrice) : null,
        reward: parseFloat(reward),
        fromCountry,
        fromCity,
        toCountry,
        toCity,
        deadline: deadline ? new Date(deadline) : null,
        deliveryType: (deliveryType as "standard" | "click_and_collect") || "standard",
        pickupLocation: pickupLocation || null,
        pickupInstructions: pickupInstructions || null,
        status: "open",
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("[requests POST]", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
