import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  // Allow any authenticated user to upload images
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
  const buffer = Buffer.from(bytes);

  const ext = file.type.split('/')[1];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return successResponse({ url: `/uploads/${filename}` }, 201);
}
