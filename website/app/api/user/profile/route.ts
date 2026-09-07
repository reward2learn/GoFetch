import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

// The fields we expose + accept on the profile API.
const PASSPORT_FIELDS = [
  "passportImageUrl",
  "passportFullName",
  "passportDocumentNo",
  "passportNationality",
  "passportDateOfBirth",
  "passportSex",
  "passportExpiryDate",
  "passportDateOfIssue",
  "passportPlaceOfBirth",
] as const;

// Fields that are DateTime in the DB but received as ISO strings from the client
const DATE_FIELDS = new Set(["passportDateOfBirth", "passportExpiryDate", "passportDateOfIssue"]);

const BASE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  walletAddress: true,
  role: true,
  kycStatus: true,
  createdAt: true,
  theme: true,
  // Passport fields
  passportImageUrl: true,
  passportFullName: true,
  passportDocumentNo: true,
  passportNationality: true,
  passportDateOfBirth: true,
  passportSex: true,
  passportExpiryDate: true,
  passportDateOfIssue: true,
  passportPlaceOfBirth: true,
} as const;

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
      select: BASE_SELECT,
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

    // Build the update payload
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (theme !== undefined) updateData.theme = theme;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Allow all passport fields to be set/cleared via this endpoint
    for (const field of PASSPORT_FIELDS) {
      if (body[field] !== undefined) {
        // Convert date strings to Date objects for DateTime fields
        if (DATE_FIELDS.has(field) && typeof body[field] === "string") {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

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
      select: BASE_SELECT,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[user/profile PUT]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
