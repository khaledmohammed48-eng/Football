import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { updateTeamSchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      coaches: { select: { id: true, name: true, photoUrl: true } },
      players: { select: { id: true, name: true, photoUrl: true, position: true } },
    },
  });

  if (!team) return errorResponse('الفريق غير موجود', 404);

  if (session!.user.role !== 'SUPER_ADMIN' && team.academyId !== session!.user.academyId) {
    return errorResponse('غير مصرح', 403);
  }

  return successResponse({
    ...team,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const existing = await prisma.team.findUnique({ where: { id: params.id } });
  if (!existing) return errorResponse('الفريق غير موجود', 404);
  if (existing.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  const team = await prisma.team.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return successResponse({
    ...team,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const team = await prisma.team.findUnique({ where: { id: params.id } });
  if (!team) return errorResponse('الفريق غير موجود', 404);
  if (team.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  await prisma.team.delete({ where: { id: params.id } });
  return successResponse({ message: 'تم حذف الفريق' });
}
