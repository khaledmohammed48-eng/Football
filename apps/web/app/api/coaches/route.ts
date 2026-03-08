import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const coaches = await prisma.coach.findMany({
    where: { academyId: session!.user.academyId },
    orderBy: { name: 'asc' },
    include: {
      team: { select: { id: true, name: true } },
      user: { select: { mobile: true } },
    },
  });

  return successResponse(
    coaches.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  );
}
