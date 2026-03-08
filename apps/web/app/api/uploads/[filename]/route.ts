import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml',
};

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  // Prevent path traversal
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const buffer = await readFile(join(UPLOAD_DIR, filename));
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType = MIME[ext] ?? 'image/jpeg';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
