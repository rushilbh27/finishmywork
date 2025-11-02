import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch a single message by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(message);
}
