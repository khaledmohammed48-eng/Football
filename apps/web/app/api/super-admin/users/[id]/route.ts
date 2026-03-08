import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const patchSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional(),
  mobile: z.string().min(9, 'رقم الجوال غير صالح').optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role !== 'ADMIN') return errorResponse('المستخدم غير موجود', 404);

  const updateData: { password?: string; mobile?: string } = {};
  if (parsed.data.password) {
    updateData.password = await bcrypt.hash(parsed.data.password, 12);
  }
  if (parsed.data.mobile) {
    updateData.mobile = parsed.data.mobile;
  }

  await prisma.user.update({ where: { id: params.id }, data: updateData });

  return successResponse({ message: 'تم التحديث بنجاح' });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role !== 'ADMIN') return errorResponse('المستخدم غير موجود', 404);

  await prisma.user.delete({ where: { id: params.id } });

  return successResponse({ message: 'تم حذف المدير بنجاح' });
}
