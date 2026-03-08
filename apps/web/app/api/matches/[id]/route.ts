import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { notifyMatch } from '@/lib/notifications';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const body = await request.json() as {
    action?: string;
    homeScore?: number;
    awayScore?: number;
    resultNotes?: string;
  };

  const match = await prisma.matchRequest.findUnique({
    where: { id: params.id },
    include: {
      fromAcademy: { select: { id: true, name: true } },
      toAcademy:   { select: { id: true, name: true } },
    },
  });
  if (!match) return errorResponse('الطلب غير موجود', 404);

  const myAcademyId = session!.user.academyId!;

  // ── Enter / update result ──────────────────────────────────────────────────
  if (body.action === 'RESULT') {
    if (match.fromAcademyId !== myAcademyId && match.toAcademyId !== myAcademyId) {
      return errorResponse('غير مصرح', 403);
    }
    if (match.status !== 'ACCEPTED') {
      return errorResponse('يمكن إدخال النتيجة فقط للمباريات المقبولة', 400);
    }
    if (body.homeScore === undefined || body.awayScore === undefined) {
      return errorResponse('يجب إدخال نتيجة الفريقين', 400);
    }
    if (body.homeScore < 0 || body.awayScore < 0) {
      return errorResponse('النتيجة لا يمكن أن تكون سالبة', 400);
    }

    const updated = await prisma.matchRequest.update({
      where: { id: params.id },
      data: {
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        resultNotes: body.resultNotes ?? null,
      },
      include: {
        fromAcademy: { select: { id: true, name: true } },
        toAcademy:   { select: { id: true, name: true } },
      },
    });

    // 🔔 Notify both academies of result
    notifyMatch({
      type: 'MATCH_RESULT',
      matchId: updated.id,
      fromAcademyId: updated.fromAcademyId,
      toAcademyId: updated.toAcademyId,
      ageGroup: updated.ageGroup,
      title: '🏆 نتيجة مباراة',
      body: `${updated.fromAcademy.name} ${body.homeScore} - ${body.awayScore} ${updated.toAcademy.name} (فئة ${updated.ageGroup})`,
    }).catch(() => {});

    return successResponse({
      ...updated,
      proposedDate: updated.proposedDate.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }

  // ── Accept / Reject ────────────────────────────────────────────────────────
  const { action } = body;
  if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
    return errorResponse('الإجراء غير صالح. استخدم ACCEPT أو REJECT أو RESULT', 400);
  }

  if (match.toAcademyId !== myAcademyId) {
    return errorResponse('غير مصرح. فقط الأكاديمية المستقبلة يمكنها قبول/رفض الطلب', 403);
  }

  if (match.status !== 'PENDING') {
    return errorResponse('لا يمكن تعديل طلب غير معلق', 400);
  }

  const updated = await prisma.matchRequest.update({
    where: { id: params.id },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' },
    include: {
      fromAcademy: { select: { id: true, name: true } },
      toAcademy:   { select: { id: true, name: true } },
    },
  });

  // 🔔 Notify both academies of accept/reject
  const isAccept = action === 'ACCEPT';
  notifyMatch({
    type: isAccept ? 'MATCH_ACCEPTED' : 'MATCH_REJECTED',
    matchId: updated.id,
    fromAcademyId: updated.fromAcademyId,
    toAcademyId: updated.toAcademyId,
    ageGroup: updated.ageGroup,
    title: isAccept ? '✅ تم قبول طلب المباراة' : '❌ تم رفض طلب المباراة',
    body: `${updated.toAcademy.name} ${isAccept ? 'قبلت' : 'رفضت'} طلب المباراة ضد ${updated.fromAcademy.name} — فئة ${updated.ageGroup}`,
  }).catch(() => {});

  return successResponse({
    ...updated,
    proposedDate: updated.proposedDate.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const match = await prisma.matchRequest.findUnique({ where: { id: params.id } });
  if (!match) return errorResponse('الطلب غير موجود', 404);

  if (match.fromAcademyId !== session!.user.academyId) {
    return errorResponse('غير مصرح. فقط الأكاديمية المرسِلة يمكنها إلغاء الطلب', 403);
  }

  if (match.status !== 'PENDING') {
    return errorResponse('لا يمكن إلغاء طلب غير معلق', 400);
  }

  await prisma.matchRequest.delete({ where: { id: params.id } });
  return successResponse({ message: 'تم إلغاء الطلب' });
}
