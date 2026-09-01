import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find orders where user is buyer or traveler
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: session.userId },
          { travelerId: session.userId },
        ],
      },
      include: {
        buyer: { select: { id: true, name: true, avatarUrl: true, walletAddress: true } },
        traveler: { select: { id: true, name: true, avatarUrl: true, walletAddress: true } },
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const conversations = orders.map((order) => {
      const otherUser = order.buyerId === session.userId ? order.traveler : order.buyer;
      const lastMessage = order.chatMessages[0] || null;
      return {
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
