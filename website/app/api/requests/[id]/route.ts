import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";

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
