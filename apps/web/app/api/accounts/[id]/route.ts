import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return errorResponse('المستخدم غير موجود', 404);
  if (user.role === 'ADMIN') return errorResponse('لا يمكن حذف حساب المدير', 400);

  await prisma.user.delete({ where: { id: params.id } });
  return successResponse({ message: 'تم حذف الحساب' });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();

  if (body.password) {
    const hashed = await bcrypt.hash(body.password, 12);
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashed },
    });
    return successResponse({ message: 'تم تغيير كلمة المرور' });
  }

  return errorResponse('لا توجد بيانات للتحديث', 400);
}
