import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

// GET — return current admin's mobile
export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, email: true, mobile: true },
  });

  if (!user) return errorResponse('المستخدم غير موجود', 404);
  return successResponse(user);
}

// PATCH — update mobile and/or password
export async function PATCH(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json() as {
    mobile?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const updates: { mobile?: string; password?: string } = {};

  // Mobile update
  if (body.mobile !== undefined) {
    const mobile = body.mobile.trim();
    if (!/^05\d{8}$/.test(mobile)) {
      return errorResponse('رقم الجوال غير صالح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام', 400);
    }
    // Check uniqueness (exclude self)
    const existing = await prisma.user.findFirst({
      where: { mobile, NOT: { id: session!.user.id } },
    });
    if (existing) return errorResponse('رقم الجوال مستخدم من حساب آخر', 409);
    updates.mobile = mobile;
  }

  // Password update
  if (body.newPassword !== undefined) {
    if (!body.currentPassword) {
      return errorResponse('يرجى إدخال كلمة المرور الحالية', 400);
    }
    if (body.newPassword.length < 8) {
      return errorResponse('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
    if (!user) return errorResponse('المستخدم غير موجود', 404);

    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) return errorResponse('كلمة المرور الحالية غير صحيحة', 400);

    updates.password = await bcrypt.hash(body.newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('لا توجد بيانات للتحديث', 400);
  }

  await prisma.user.update({
    where: { id: session!.user.id },
    data: updates,
  });

  return successResponse({ message: 'تم تحديث البيانات بنجاح' });
}
