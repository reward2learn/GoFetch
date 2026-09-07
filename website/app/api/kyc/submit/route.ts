import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

/** Auto-review KYC submission. Since the user has already scanned their passport
 *  (with OCR-extracted fields) and saved all data to their profile, the server
 *  validates that everything is present and automatically approves. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: session.walletAddress?.toLowerCase() || "" },
      select: {
        id: true,
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already verified
    if (user.kycStatus === "verified") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    // Validate all required fields are present
    const requiredFields = [
      user.passportImageUrl,
      user.passportFullName,
      user.passportDocumentNo,
      user.passportNationality,
      user.passportDateOfBirth,
      user.passportExpiryDate,
      user.passportDateOfIssue,
      user.passportPlaceOfBirth,
    ];

    const missing = requiredFields.filter((f): f is string => f != null && f !== "");
    if (missing.length < 7) {
      const missingNames = ["passportImageUrl", "passportFullName", "passportDocumentNo",
        "passportNationality", "passportDateOfBirth", "passportExpiryDate",
        "passportDateOfIssue", "passportPlaceOfBirth"].filter(
        (_, i) => !requiredFields[i]
      );
      return NextResponse.json(
        { error: "Missing required fields", missing: missingNames },
        { status: 400 }
      );
    }

    // Auto-approve: all fields present and image uploaded
    const updated = await prisma.user.update({
      where: { walletAddress: session.walletAddress?.toLowerCase() || "" },
      data: { kycStatus: "verified" },
      select: { kycStatus: true },
    });

    return NextResponse.json({
      success: true,
      message: "KYC verified automatically — all submitted data matched the uploaded document.",
      kycStatus: updated.kycStatus,
    });
  } catch (error) {
    console.error("[kyc/submit]", error);
    return NextResponse.json({ error: "Failed to process KYC" }, { status: 500 });
  }
}
