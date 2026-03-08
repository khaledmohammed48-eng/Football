import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ??
  (process.env.NODE_ENV === 'production' ? '/data/uploads' : join(process.cwd(), 'uploads'));

export async function POST(request: Request) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return errorResponse('لم يتم اختيار ملف', 400);

  if (!file.type.startsWith('image/')) return errorResponse('يجب أن يكون الملف صورة', 400);
  if (file.size > 3 * 1024 * 1024) return errorResponse('حجم الصورة يجب أن يكون أقل من 3 ميجابايت', 400);

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes));

  return successResponse({ url: `/api/uploads/${filename}` });
}
