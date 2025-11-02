import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_COUNT = 113; // 👈 your default visible start

export async function GET() {
  try {
    const actual = await prisma.waitlist.count();
    const count = BASE_COUNT + actual;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Error fetching waitlist count:", error);
    return NextResponse.json({ count: BASE_COUNT }, { status: 500 });
  }
}
