import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/coach/lineup?teamId=xxx&name=التشكيلة الرئيسية
export async function GET(request: Request) {
  const { error, status, session } = await requireAuth(['COACH', 'ADMIN']);
  if (error) return errorResponse(error, status);

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const name   = searchParams.get('name') ?? 'التشكيلة الرئيسية';

  if (!teamId) return errorResponse('teamId مطلوب', 400);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });
  if (!coach) return errorResponse('المدرب غير موجود', 404);

  const lineup = await prisma.teamLineup.findUnique({
    where: { coachId_teamId_name: { coachId: coach.id, teamId, name } },
  });

  if (!lineup) return successResponse(null); // no lineup saved yet

  return successResponse({
    id:        lineup.id,
    name:      lineup.name,
    formation: lineup.formation,
    slots:     JSON.parse(lineup.slots) as Record<string, string>,
  });
}

// PUT /api/coach/lineup
// body: { teamId, name?, formation, slots: { slotIndex: playerId } }
export async function PUT(request: Request) {
  const { error, status, session } = await requireAuth(['COACH', 'ADMIN']);
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const { teamId, formation, slots } = body as {
    teamId: string;
    name?: string;
    formation: string;
    slots: Record<string, string>;
  };
  const name = body.name ?? 'التشكيلة الرئيسية';

  if (!teamId || !formation || !slots) return errorResponse('بيانات ناقصة', 400);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });
  if (!coach) return errorResponse('المدرب غير موجود', 404);

  const lineup = await prisma.teamLineup.upsert({
    where: { coachId_teamId_name: { coachId: coach.id, teamId, name } },
    update: { formation, slots: JSON.stringify(slots) },
    create: { coachId: coach.id, teamId, name, formation, slots: JSON.stringify(slots) },
  });

  return successResponse({
    id:        lineup.id,
    name:      lineup.name,
    formation: lineup.formation,
    slots:     JSON.parse(lineup.slots) as Record<string, string>,
  });
}
