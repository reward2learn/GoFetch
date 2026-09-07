import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { createToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  authProvider: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { walletAddress, name, email, avatarUrl, authProvider } = parsed.data;
    const normalizedAddress = walletAddress.toLowerCase();

    try {
      // Find or create user
      let user = await prisma.user.findFirst({
        where: { walletAddress: normalizedAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: normalizedAddress,
            name: name || `User ${normalizedAddress.slice(0, 6)}`,
            email: email || `${normalizedAddress.slice(0, 10)}@wallet.local`,
            avatarUrl: avatarUrl || null,
            token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          },
        });
      } else if ((name || email || avatarUrl) && authProvider) {
        // Social login: update existing user with real profile if they still have placeholders
        const needsUpdate =
          (email && user.email?.endsWith("@wallet.local")) ||
          (name && user.name?.startsWith("0x")) ||
          (name && user.name?.startsWith("User 0x")) ||
          (avatarUrl && !user.avatarUrl);
        if (needsUpdate) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              ...(name && (user.name?.startsWith("0x") || user.name?.startsWith("User 0x")) && { name }),
              ...(email && user.email?.endsWith("@wallet.local") && { email }),
              ...(avatarUrl && !user.avatarUrl && { avatarUrl }),
            },
          });
        }
      }

      // Generate JWT
      const token = await createToken({
        userId: user.id,
        walletAddress: user.walletAddress,
      });

      const response = NextResponse.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    } catch (dbError) {
      // DB down — generate JWT from address directly as fallback
      console.error("[auth/login] DB error, using address-based fallback:", dbError);

      const token = await createToken({
        userId: normalizedAddress,
        walletAddress: normalizedAddress,
      });

      const response = NextResponse.json({
        token,
        user: {
          id: normalizedAddress,
          name: name || `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
          email: `${normalizedAddress.slice(0, 10)}@wallet.local`,
          walletAddress: normalizedAddress,
          role: "buyer",
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
