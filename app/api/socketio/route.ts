import { NextResponse } from "next/server";
import { ensureSocketIO } from "@/lib/socketServer";

export async function GET() {
  ensureSocketIO();
  return NextResponse.json({ message: "Socket.IO initialized" });
}
