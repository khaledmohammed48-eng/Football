import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { createAdminUserSchema } from '@football-academy/shared';
import bcrypt from 'bcryptjs';

export async function GET() {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'desc' },
    include: {
      academy: { select: { id: true, name: true } },
    },
  });

  return successResponse(
    users.map((u) => ({
      id: u.id,
      mobile: u.mobile,
      role: u.role,
      academyId: u.academyId,
      academyName: u.academy?.name ?? null,
      createdAt: u.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createAdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const { mobile, password, academyId } = parsed.data;

  const existingMobile = await prisma.user.findFirst({ where: { mobile, role: 'ADMIN' } });
  if (existingMobile) return errorResponse('رقم الجوال مستخدم بالفعل', 409);

  const academy = await prisma.academy.findUnique({ where: { id: academyId } });
  if (!academy) return errorResponse('الأكاديمية غير موجودة', 404);

  // Generate a unique placeholder email — mobile is the real login identifier
  const placeholderEmail = `admin_${mobile}_${crypto.randomUUID().slice(0, 8)}@admin.local`;

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: placeholderEmail, mobile, password: hashedPassword, role: 'ADMIN', academyId },
  });

  return successResponse({ id: user.id, mobile: user.mobile, role: user.role, academyId }, 201);
}
