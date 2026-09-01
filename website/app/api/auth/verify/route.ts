import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { createToken } from "@/lib/auth";
import { z } from "zod";

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address").optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  message: z.string().min(1),
  signature: z.string().min(1),
}).refine((data) => data.address || data.walletAddress, {
  message: "Either address or walletAddress is required",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const walletAddress = parsed.data.address || parsed.data.walletAddress || "";
    const normalizedAddress = walletAddress.toLowerCase();

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          name: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
          email: `${normalizedAddress.slice(0, 10)}@wallet.local`,
          token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        },
      });
    }

    // Generate JWT
    const token = await createToken({
      userId: user.id,
      walletAddress: user.walletAddress,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[auth/verify]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
