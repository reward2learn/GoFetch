import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/db";

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "theme" },
    });
    if (!setting) {
      return NextResponse.json({ error: "No theme found" }, { status: 404 });
    }
    return NextResponse.json(setting.value);
  } catch (error) {
    console.error("Failed to fetch theme:", error);
    return NextResponse.json({ error: "Failed to fetch theme" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.walletAddress || !isAdmin(session.walletAddress)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validate the body has light and/or dark keys
    if (!body.light && !body.dark) {
      return NextResponse.json({ error: "Invalid theme data" }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: "theme" },
      update: { value: body },
      create: { key: "theme", value: body },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }
}
