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
      select: { id: true, name: true, email: true, walletAddress: true, role: true, kycStatus: true, createdAt: true },
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
    const { name, email } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: { id: true, name: true, email: true, walletAddress: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[user/profile PUT]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
