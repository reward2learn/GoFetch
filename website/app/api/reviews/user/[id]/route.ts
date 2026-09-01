import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Guard against invalid/undefined user IDs
    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json({ reviews: [], stats: { total: 0, averageRating: 0 } });
    }

    const userReviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reviewer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const avgRating =
      userReviews.length > 0
        ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
        : 0;

    return NextResponse.json({
      reviews: userReviews,
      stats: {
        total: userReviews.length,
        averageRating: Math.round(avgRating * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[reviews/user]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
