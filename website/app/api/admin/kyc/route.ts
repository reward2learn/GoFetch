import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/db";

interface KYCListItem {
  id: string;
  walletAddress: string;
  name: string | null;
  email: string | null;
  kycStatus: string;
  isBlacklisted: boolean;
  passportImageUrl: string | null;
  passportFullName: string | null;
  passportDocumentNo: string | null;
  passportNationality: string | null;
  passportDateOfBirth: Date | null;
  passportSex: string | null;
  passportExpiryDate: Date | null;
  passportDateOfIssue: Date | null;
  passportPlaceOfBirth: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.walletAddress)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        walletAddress: true,
        name: true,
        email: true,
        kycStatus: true,
        isBlacklisted: true,
        passportImageUrl: true,
        passportFullName: true,
        passportDocumentNo: true,
        passportNationality: true,
        passportDateOfBirth: true,
        passportSex: true,
        passportExpiryDate: true,
        passportDateOfIssue: true,
        passportPlaceOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const kycUsers = allUsers.filter(
      (u) =>
        u.kycStatus !== "none" ||
        u.passportImageUrl != null ||
        u.passportFullName != null ||
        u.passportDocumentNo != null
    );

    return NextResponse.json(kycUsers);
  } catch (error) {
    console.error("[admin/kyc GET]", error);
    return NextResponse.json({ error: "Failed to fetch KYC list" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.walletAddress)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    const validActions = ["approve", "revoke", "blacklist", "unblacklist"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true, name: true, kycStatus: true, isBlacklisted: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const kycData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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

    if (action === "approve") {
      const requiredFields = [
        kycData?.passportImageUrl,
        kycData?.passportFullName,
        kycData?.passportDocumentNo,
        kycData?.passportNationality,
        kycData?.passportDateOfBirth,
        kycData?.passportExpiryDate,
        kycData?.passportDateOfIssue,
        kycData?.passportPlaceOfBirth,
      ];
      const missingCount = requiredFields.filter((f): f is string => f != null && f !== "").length;
      if (missingCount < 7) {
        return NextResponse.json({ error: "Cannot approve — missing required fields", missingCount }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "verified" },
      });

      await createNotification(userId, "KYC Approved", "Your KYC has been approved. You now have full access to the platform.", "kyc_approved");

      return NextResponse.json({ success: true, message: "User approved and verified" });
    }

    if (action === "revoke") {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "none", isBlacklisted: false },
      });

      await createNotification(userId, "KYC Revoked", "Your KYC status has been revoked. Contact an admin if you believe this is an error.", "kyc_revoked");

      return NextResponse.json({ success: true, message: "KYC revoked" });
    }

    if (action === "blacklist") {
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: "rejected", isBlacklisted: true },
      });

      await createNotification(userId, "Account Blacklisted", "Your account has been blacklisted. Access to the platform has been revoked.", "account_blacklisted");

      return NextResponse.json({ success: true, message: "User blacklisted and access revoked" });
    }

    if (action === "unblacklist") {
      await prisma.user.update({
        where: { id: userId },
        data: { isBlacklisted: false },
      });

      await createNotification(userId, "Blacklist Removed", "Your blacklist status has been removed. You may reapply for KYC.", "blacklist_removed");

      return NextResponse.json({ success: true, message: "Blacklist removed" });
    }

    return NextResponse.json({ error: "Unexpected action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/kyc POST]", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}

async function createNotification(userId: string, title: string, body: string, type: string) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body },
    });
  } catch (e) {
    console.error("[createNotification]", e);
  }
}
