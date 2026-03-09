import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Public endpoint — no auth required
// Returns the first academy's name and logo for the login page
export async function GET() {
  try {
    const academy = await prisma.academy.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { name: true, logoUrl: true },
    });

    return NextResponse.json({ name: academy?.name ?? null, logoUrl: academy?.logoUrl ?? null });
  } catch {
    return NextResponse.json({ name: null, logoUrl: null });
  }
}
