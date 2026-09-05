import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    // Find orders where user is buyer or traveler — select only needed fields
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: session.userId },
          { travelerId: session.userId },
        ],
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        buyerId: true,
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        traveler: { select: { id: true, name: true, avatarUrl: true } },
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    const conversations = orders.map((order) => {
      const otherUser = order.buyerId === session.userId ? order.traveler : order.buyer;
      const lastMessage = order.chatMessages[0] || null;
      return {
        id: order.id,
        orderId: order.id,
        otherUser,
        lastMessage: lastMessage?.text || null,
        lastMessageAt: lastMessage?.createdAt || order.createdAt,
        status: order.status,
      };
    }).filter((c) => c.otherUser);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[chat/conversations]", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
