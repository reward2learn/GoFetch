import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Run raw SQL to add columns if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE requests 
      ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS pickup_location TEXT,
      ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;
    `);

    // Add theme column to users table
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'system'`;
    } catch (e) {
      // Column may already exist
    }

    return NextResponse.json({ success: true, message: "Migration completed" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
