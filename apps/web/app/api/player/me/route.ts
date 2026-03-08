import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/player/me
 * Allows the logged-in player or coach to change their own password.
 * Body: { currentPassword: string, newPassword: string }
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return errorResponse('غير مصرح', 401);
  if (!['PLAYER', 'COACH'].includes(session.user.role)) return errorResponse('غير مصرح', 403);

  const body = await request.json();
  const { currentPassword, newPassword } = body ?? {};

  if (!currentPassword || !newPassword) {
    return errorResponse('كلمة المرور الحالية والجديدة مطلوبتان', 400);
  }
  if (newPassword.length < 6) {
    return errorResponse('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return errorResponse('المستخدم غير موجود', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return errorResponse('كلمة المرور الحالية غير صحيحة', 401);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return successResponse({ message: 'تم تغيير كلمة المرور بنجاح' });
}
