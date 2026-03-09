import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { updateCoachSchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { id: params.id },
    include: {
      team: { select: { id: true, name: true } },
      coachTeams: { include: { team: { select: { id: true, name: true } } } },
      user: { select: { email: true } },
    },
  });

  if (!coach) return errorResponse('المدرب غير موجود', 404);
  if (coach.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  return successResponse({
    ...coach,
    teamIds: coach.coachTeams.map((ct) => ct.teamId),
    teams: coach.coachTeams.map((ct) => ct.team),
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = updateCoachSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const existing = await prisma.coach.findUnique({ where: { id: params.id } });
  if (!existing) return errorResponse('المدرب غير موجود', 404);
  if (existing.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  const { teamIds, ...coreData } = parsed.data;

  // If teamIds provided — sync the CoachTeam join table
  if (teamIds !== undefined) {
    await prisma.coachTeam.deleteMany({ where: { coachId: params.id } });
    if (teamIds.length > 0) {
      await prisma.coachTeam.createMany({
        data: teamIds.map((tid) => ({ coachId: params.id, teamId: tid })),
      });
    }
    // Keep teamId in sync with first team (for backward compat)
    coreData.teamId = teamIds[0] ?? null;
  }

  const coach = await prisma.coach.update({
    where: { id: params.id },
    data: coreData,
    include: {
      team: { select: { id: true, name: true } },
      coachTeams: { include: { team: { select: { id: true, name: true } } } },
    },
  });

  return successResponse({
    ...coach,
    teamIds: coach.coachTeams.map((ct) => ct.teamId),
    teams: coach.coachTeams.map((ct) => ct.team),
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({ where: { id: params.id } });
  if (!coach) return errorResponse('المدرب غير موجود', 404);
  if (coach.academyId !== session!.user.academyId) return errorResponse('غير مصرح', 403);

  await prisma.user.delete({ where: { id: coach.userId } });
  return successResponse({ message: 'تم حذف المدرب' });
}
