import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { walletAddress: session.walletAddress?.toLowerCase() },
      update: {},
      create: {
        walletAddress: session.walletAddress?.toLowerCase() || "",
        name: `${session.walletAddress?.slice(0, 6)}...${session.walletAddress?.slice(-4)}`,
        email: `${session.walletAddress?.slice(0, 10)}@wallet.local`,
        token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      },
      select: { id: true, name: true, email: true, avatarUrl: true, walletAddress: true, role: true, kycStatus: true, createdAt: true, theme: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[user/profile GET]", error);
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

    const user = await prisma.user.upsert({
      where: { walletAddress: session.walletAddress?.toLowerCase() },
      update: updateData,
      create: {
        walletAddress: session.walletAddress?.toLowerCase() || "",
        name: name || `${session.walletAddress?.slice(0, 6)}...${session.walletAddress?.slice(-4)}`,
        email: email || `${session.walletAddress?.slice(0, 10)}@wallet.local`,
        token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ...updateData,
      },
      select: { id: true, name: true, email: true, avatarUrl: true, walletAddress: true, role: true, theme: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[user/profile PUT]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
