import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/db";

const DEFAULT_THEME = {
  light: {
    "surface-0": "#ffffff",
    "surface-1": "#f8f9fa",
    "surface-2": "#e9ecef",
    "surface-3": "#dee2e6",
    "text-primary": "#212529",
    "text-secondary": "#495057",
    "text-tertiary": "#868e96",
    primary: "#3b82f6",
    "primary-color": "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  dark: {
    "surface-0": "#0a0a0a",
    "surface-1": "#171717",
    "surface-2": "#262626",
    "surface-3": "#404040",
    "text-primary": "#fafafa",
    "text-secondary": "#a3a3a3",
    "text-tertiary": "#737373",
    primary: "#3b82f6",
    "primary-color": "#60a5fa",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
  },
};

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "theme" },
      select: { value: true },
    });
    if (!setting) {
      return NextResponse.json(DEFAULT_THEME, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }
    return NextResponse.json(setting.value, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch theme:", error);
    // Return defaults instead of 500 so the app still renders
    return NextResponse.json(DEFAULT_THEME, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
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
