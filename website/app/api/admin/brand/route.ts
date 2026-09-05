import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/db";

const DEFAULT_BRAND = {
  logo: null,
  name: "GoFetch",
  subtitle: "Global Delivery",
  favicon: null,
  loadingGraphic: null,
  loginTagline: "P2P Global Shopping & Delivery",
  loginSubtitle: "Connect your wallet to start buying or delivering items worldwide.",
  poweredBy: "Powered by USDC on Base Sepolia",
};

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "brand" },
      select: { value: true },
    });
    if (!setting) {
      return NextResponse.json(DEFAULT_BRAND, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }
    return NextResponse.json(setting.value, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch brand settings:", error);
    // Return defaults instead of 500 so the app still renders
    return NextResponse.json(DEFAULT_BRAND, {
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

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    // Validate image sizes (max 2MB each for base64)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (body.logo && body.logo.length > MAX_SIZE * 1.4) {
      return NextResponse.json({ error: "Logo must be under 2MB" }, { status: 400 });
    }
    if (body.favicon && body.favicon.length > MAX_SIZE * 1.4) {
      return NextResponse.json({ error: "Favicon must be under 2MB" }, { status: 400 });
    }
    if (body.loadingGraphic && body.loadingGraphic.length > MAX_SIZE * 1.4) {
      return NextResponse.json({ error: "Loading graphic must be under 2MB" }, { status: 400 });
    }

    const brandData = {
      logo: body.logo || null,
      name: body.name,
      subtitle: body.subtitle || "Global Delivery",
      favicon: body.favicon || null,
      loadingGraphic: body.loadingGraphic || null,
      loginTagline: body.loginTagline || "P2P Global Shopping & Delivery",
      loginSubtitle: body.loginSubtitle || "Connect your wallet to start buying or delivering items worldwide.",
      poweredBy: body.poweredBy || "Powered by USDC on Base Sepolia",
    };

    await prisma.appSetting.upsert({
      where: { key: "brand" },
      update: { value: brandData },
      create: { key: "brand", value: brandData },
    });

    return NextResponse.json({ success: true, brand: brandData });
  } catch (error) {
    console.error("Failed to update brand settings:", error);
    return NextResponse.json({ error: "Failed to update brand settings" }, { status: 500 });
  }
}
