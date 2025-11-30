export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_COUNT = 113; // starting number

export async function GET() {
  const count = await prisma.waitlist.count();
  const total = BASE_COUNT + count;

  return NextResponse.json(
    { count: total },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
