import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { createAcademySchema } from '@football-academy/shared';
import bcrypt from 'bcryptjs';

export async function GET() {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const academies = await prisma.academy.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, teams: true, players: true, coaches: true } },
    },
  });

  return successResponse(
    academies.map((a) => ({
      ...a,
      ageGroups: JSON.parse(a.ageGroups) as string[],
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createAcademySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const { ageGroups, ...rest } = parsed.data;

  // Optional admin user fields
  const adminMobile: string | undefined = body.adminMobile?.trim() || undefined;
  const adminPassword: string | undefined = body.adminPassword || undefined;

  // Validate admin fields if provided
  if (adminMobile || adminPassword) {
    if (!adminMobile) return errorResponse('رقم جوال المدير مطلوب', 400);
    if (!adminPassword || adminPassword.length < 6) return errorResponse('كلمة مرور المدير يجب أن تكون 6 أحرف على الأقل', 400);
    const existingMobile = await prisma.user.findFirst({ where: { mobile: adminMobile, role: 'ADMIN' } });
    if (existingMobile) return errorResponse('رقم جوال المدير مستخدم بالفعل', 409);
  }

  // Create academy (and optionally its admin) in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const academy = await tx.academy.create({
      data: { ...rest, ageGroups: JSON.stringify(ageGroups) },
    });

    let adminUser = null;
    if (adminMobile && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const placeholderEmail = `admin_${adminMobile}_${crypto.randomUUID().slice(0, 8)}@admin.local`;
      adminUser = await tx.user.create({
        data: { email: placeholderEmail, mobile: adminMobile, password: hashedPassword, role: 'ADMIN', academyId: academy.id },
      });
    }

    return { academy, adminUser };
  });

  return successResponse({
    ...result.academy,
    ageGroups: JSON.parse(result.academy.ageGroups) as string[],
    createdAt: result.academy.createdAt.toISOString(),
    updatedAt: result.academy.updatedAt.toISOString(),
    admin: result.adminUser ? { id: result.adminUser.id, mobile: result.adminUser.mobile } : null,
  }, 201);
}
