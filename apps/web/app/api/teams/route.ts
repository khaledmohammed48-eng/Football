import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { createTeamSchema } from '@football-academy/shared';
import { notifyNewTeam } from '@/lib/notifications';

export async function GET() {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const teams = await prisma.team.findMany({
    where: { academyId: session!.user.academyId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { coaches: true, players: true } } },
  });

  return successResponse(
    teams.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() }))
  );
}

export async function POST(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);

  const academyId = session!.user.academyId!;
  const team = await prisma.team.create({ data: { ...parsed.data, academyId } });

  // 🔔 Notify coaches + admin
  notifyNewTeam({ academyId, teamName: team.name }).catch(() => {});

  return successResponse(
    { ...team, createdAt: team.createdAt.toISOString(), updatedAt: team.updatedAt.toISOString() },
    201
  );
}
