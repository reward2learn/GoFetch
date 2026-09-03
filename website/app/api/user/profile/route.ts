import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, avatarUrl: true, walletAddress: true, role: true, kycStatus: true, createdAt: true, theme: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, theme, avatarUrl } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (theme !== undefined) updateData.theme = theme;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: { id: true, name: true, email: true, avatarUrl: true, walletAddress: true, role: true, theme: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[user/profile PUT]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
