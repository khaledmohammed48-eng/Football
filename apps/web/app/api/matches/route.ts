import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { createMatchRequestSchema } from '@football-academy/shared';
import { notifyMatch } from '@/lib/notifications';

export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const myAcademyId = session!.user.academyId!;

  const matches = await prisma.matchRequest.findMany({
    where: {
      OR: [
        { fromAcademyId: myAcademyId },
        { toAcademyId: myAcademyId },
      ],
    },
    include: {
      fromAcademy: { select: { id: true, name: true, logoUrl: true, city: true } },
      toAcademy: { select: { id: true, name: true, logoUrl: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(
    matches.map((m) => ({
      ...m,
      proposedDate: m.proposedDate.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json();
  const parsed = createMatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'بيانات غير صالحة', 400);
  }

  const { toAcademyId, ageGroup, proposedDate, location, homeOrAway, notes } = parsed.data;
  const fromAcademyId = session!.user.academyId!;

  if (fromAcademyId === toAcademyId) {
    return errorResponse('لا يمكن إرسال طلب مباراة إلى أكاديميتك الخاصة', 400);
  }

  const [fromAcademy, toAcademy] = await Promise.all([
    prisma.academy.findUnique({ where: { id: fromAcademyId }, select: { name: true, ageGroups: true } }),
    prisma.academy.findUnique({ where: { id: toAcademyId },   select: { name: true, ageGroups: true } }),
  ]);

  if (!fromAcademy) return errorResponse('أكاديميتك غير موجودة', 404);
  if (!toAcademy)   return errorResponse('الأكاديمية المستقبلة غير موجودة', 404);

  const fromGroups: string[] = JSON.parse(fromAcademy.ageGroups);
  const toGroups: string[]   = JSON.parse(toAcademy.ageGroups);

  if (!fromGroups.includes(ageGroup)) return errorResponse(`أكاديميتك لا تمتلك فئة ${ageGroup}`, 400);
  if (!toGroups.includes(ageGroup))   return errorResponse(`الأكاديمية المستقبلة لا تمتلك فئة ${ageGroup}`, 400);

  const match = await prisma.matchRequest.create({
    data: { fromAcademyId, toAcademyId, ageGroup, proposedDate: new Date(proposedDate), location, homeOrAway, notes },
    include: {
      fromAcademy: { select: { id: true, name: true } },
      toAcademy:   { select: { id: true, name: true } },
    },
  });

  // 🔔 Notify both academies (fire-and-forget)
  notifyMatch({
    type: 'NEW_MATCH',
    matchId: match.id,
    fromAcademyId,
    toAcademyId,
    ageGroup,
    title: '⚔️ طلب مباراة جديد',
    body: `${fromAcademy.name} تطلب مباراة ضد ${toAcademy.name} — فئة ${ageGroup}`,
  }).catch(() => {});

  return successResponse({
    ...match,
    proposedDate: match.proposedDate.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  }, 201);
}
