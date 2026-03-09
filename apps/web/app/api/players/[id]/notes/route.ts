import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { createNoteSchema } from '@football-academy/shared';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const notes = await prisma.coachNote.findMany({
    where: { playerId: params.id },
    orderBy: { createdAt: 'desc' },
    include: { coach: { select: { name: true, photoUrl: true } } },
  });

  return successResponse(
    notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }))
  );
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth(['ADMIN', 'COACH']);
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  let coachId: string;

  if (session!.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session!.user.id },
    });
    if (!coach) return errorResponse('المدرب غير موجود', 404);

    // Verify player is on coach's team
    const player = await prisma.player.findUnique({ where: { id: params.id } });
    if (player?.teamId !== coach.teamId) {
      return errorResponse('اللاعب ليس في فريقك', 403);
    }
    coachId = coach.id;
  } else {
    // Admin — must find or use first coach as proxy (or create admin-level note)
    // For MVP, admin uses a special system coach entry if needed
    const anyCoach = await prisma.coach.findFirst();
    if (!anyCoach) return errorResponse('لا يوجد مدرب مسجل', 400);
    coachId = anyCoach.id;
  }

  const note = await prisma.coachNote.create({
    data: {
      content: parsed.data.content,
      playerId: params.id,
      coachId,
    },
    include: { coach: { select: { name: true, photoUrl: true } } },
  });

  return successResponse(
    {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    },
    201
  );
}
