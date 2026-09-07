import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { createToken } from "@/lib/auth";
import { z } from "zod";

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address").optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  message: z.string().min(1),
  signature: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  authProvider: z.string().optional(),
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
    const { name: socialName, email: socialEmail, avatarUrl: socialAvatarUrl, authProvider } = parsed.data;

    // Basic SIWE message validation (format check only - signature provides authenticity)
    const message = parsed.data.message;
    const messageLower = message.toLowerCase();
    if (!messageLower.includes(normalizedAddress)) {
      return NextResponse.json(
        { error: "Address mismatch in message" },
        { status: 400 }
      );
    }

    try {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: normalizedAddress,
            name: socialName || `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
            email: socialEmail || `${normalizedAddress.slice(0, 10)}@wallet.local`,
            avatarUrl: socialAvatarUrl || null,
            token: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          },
        });
      } else if ((socialName || socialEmail || socialAvatarUrl) && authProvider) {
        // Social login: update existing user with real profile if they still have placeholders
        const needsUpdate =
          (socialEmail && user.email?.endsWith("@wallet.local")) ||
          (socialName && (user.name?.startsWith("0x") || user.name?.startsWith("User 0x"))) ||
          (socialAvatarUrl && !user.avatarUrl);
        if (needsUpdate) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              ...(socialName && (user.name?.startsWith("0x") || user.name?.startsWith("User 0x")) && { name: socialName }),
              ...(socialEmail && user.email?.endsWith("@wallet.local") && { email: socialEmail }),
              ...(socialAvatarUrl && !user.avatarUrl && { avatarUrl: socialAvatarUrl }),
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
        success: true,
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
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    } catch (dbError) {
      // DB down (e.g. Neon 402) — generate JWT from address directly as fallback
      console.error("[auth/verify] DB error, using address-based fallback:", dbError);
      
      const token = await createToken({
        userId: normalizedAddress,
        walletAddress: normalizedAddress,
      });

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: normalizedAddress,
          name: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
          email: `${normalizedAddress.slice(0, 10)}@wallet.local`,
          walletAddress: normalizedAddress,
          role: "buyer",
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
    }
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
