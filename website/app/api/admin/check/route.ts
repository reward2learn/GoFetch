import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const session = await getSession();
  if (!session?.walletAddress) {
    return NextResponse.json({ isAdmin: false });
  }
  return NextResponse.json({ isAdmin: isAdmin(session.walletAddress) });
}
