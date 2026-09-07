import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

/**
 * GET /api/kyc/check
 * Returns the current user's KYC verification status.
 * Used by the profile page to determine what badge/button to show.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: session.walletAddress?.toLowerCase() || "" },
      select: {
        id: true,
        walletAddress: true,
        kycStatus: true,
        passportImageUrl: true,
        passportFullName: true,
        passportDocumentNo: true,
        passportNationality: true,
        passportDateOfBirth: true,
        passportSex: true,
        passportExpiryDate: true,
        passportDateOfIssue: true,
        passportPlaceOfBirth: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if all required passport fields are filled
    const requiredFields = [
      user.passportImageUrl,
      user.passportFullName,
      user.passportDocumentNo,
      user.passportNationality,
      user.passportDateOfBirth,
      user.passportSex,
      user.passportExpiryDate,
      user.passportDateOfIssue,
      user.passportPlaceOfBirth,
    ];
    const allFieldsComplete = requiredFields.every((f) => f != null && f !== "");

    return NextResponse.json({
      kycStatus: user.kycStatus,
      isVerified: user.kycStatus === "verified",
      isComplete: allFieldsComplete,
      requiredFields: {
        passportImageUrl: user.passportImageUrl,
        passportFullName: user.passportFullName,
        passportDocumentNo: user.passportDocumentNo,
        passportNationality: user.passportNationality,
        passportDateOfBirth: user.passportDateOfBirth,
        passportSex: user.passportSex,
        passportExpiryDate: user.passportExpiryDate,
        passportDateOfIssue: user.passportDateOfIssue,
        passportPlaceOfBirth: user.passportPlaceOfBirth,
      },
    });
  } catch (error) {
    console.error("[kyc/check]", error);
    return NextResponse.json({ error: "Failed to fetch KYC status" }, { status: 500 });
  }
}
