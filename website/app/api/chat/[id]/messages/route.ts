import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.chatMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[chat/messages]", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        orderId,
        senderId: session.userId,
        text,
        imageUrl: body.imageUrl || null,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[chat/messages POST]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
