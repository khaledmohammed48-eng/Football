import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach?.teamId) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return errorResponse('تاريخ غير صالح', 400);
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      coachId_teamId_date: {
        coachId: coach.id,
        teamId: coach.teamId,
        date,
      },
    },
  });

  return successResponse({
    date,
    presentPlayerIds: record ? JSON.parse(record.presentPlayerIds) : [],
  });
}

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
  });
  if (!coach?.teamId) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const body = await req.json();
  const { date, presentPlayerIds } = body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return errorResponse('تاريخ غير صالح', 400);
  }
  if (!Array.isArray(presentPlayerIds)) {
    return errorResponse('بيانات الحضور غير صالحة', 400);
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      coachId_teamId_date: {
        coachId: coach.id,
        teamId: coach.teamId,
        date,
      },
    },
    create: {
      coachId: coach.id,
      teamId: coach.teamId,
      date,
      presentPlayerIds: JSON.stringify(presentPlayerIds),
    },
    update: {
      presentPlayerIds: JSON.stringify(presentPlayerIds),
    },
  });

  return successResponse({
    date: record.date,
    presentPlayerIds: JSON.parse(record.presentPlayerIds),
  });
}
