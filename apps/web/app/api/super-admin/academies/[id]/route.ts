import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { updateAcademySchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const academy = await prisma.academy.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { users: true, teams: true, players: true, coaches: true } },
      users: {
        where: { role: 'ADMIN' },
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      teams: {
        select: { id: true, name: true, _count: { select: { players: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!academy) return errorResponse('الأكاديمية غير موجودة', 404);

  return successResponse({
    ...academy,
    ageGroups: JSON.parse(academy.ageGroups) as string[],
    createdAt: academy.createdAt.toISOString(),
    updatedAt: academy.updatedAt.toISOString(),
    users: academy.users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    teams: academy.teams,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = updateAcademySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const { ageGroups, ...rest } = parsed.data;
  const academy = await prisma.academy.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(ageGroups !== undefined ? { ageGroups: JSON.stringify(ageGroups) } : {}),
    },
    include: {
      _count: { select: { users: true, teams: true, players: true, coaches: true } },
      users: { where: { role: 'ADMIN' }, select: { id: true, email: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      teams: { select: { id: true, name: true, _count: { select: { players: true } } }, orderBy: { name: 'asc' } },
    },
  });

  return successResponse({
    ...academy,
    ageGroups: JSON.parse(academy.ageGroups) as string[],
    createdAt: academy.createdAt.toISOString(),
    updatedAt: academy.updatedAt.toISOString(),
    users: academy.users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status } = await requireAuth('SUPER_ADMIN');
  if (error) return errorResponse(error, status);

  const academy = await prisma.academy.findUnique({ where: { id: params.id } });
  if (!academy) return errorResponse('الأكاديمية غير موجودة', 404);

  await prisma.academy.delete({ where: { id: params.id } });
  return successResponse({ message: 'تم حذف الأكاديمية' });
}
