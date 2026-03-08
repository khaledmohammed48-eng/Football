import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// In production (Railway) use /data/uploads (persistent volume).
// In development fall back to <cwd>/uploads.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ??
  (process.env.NODE_ENV === 'production' ? '/data/uploads' : path.join(process.cwd(), 'uploads'));

export async function POST(request: Request) {
  const { error, status } = await requireAuth(['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER']);
  if (error) return errorResponse(error, status);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return errorResponse('لم يتم رفع أي ملف', 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('نوع الملف غير مدعوم. يرجى رفع صورة JPEG أو PNG أو WebP', 400);
  }
  if (file.size > MAX_SIZE) {
    return errorResponse('حجم الملف يتجاوز الحد الأقصى (5 ميغابايت)', 400);
  }

  const bytes = await file.arrayBuffer();
  const ext = (file.name.split('.').pop() ?? file.type.split('/')[1]).toLowerCase();
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

  // Served via /api/uploads/[filename] route
  return successResponse({ url: `/api/uploads/${filename}` }, 201);
}
