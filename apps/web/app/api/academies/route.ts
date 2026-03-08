import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  // Return all academies EXCEPT the current admin's own academy (public profiles)
  const academies = await prisma.academy.findMany({
    where: {
      id: { not: session!.user.academyId! },
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      city: true,
      location: true,
      ageGroups: true,
      _count: { select: { players: true, teams: true } },
    },
    orderBy: { name: 'asc' },
  });

  return successResponse(
    academies.map((a) => ({
      ...a,
      ageGroups: JSON.parse(a.ageGroups) as string[],
    }))
  );
}
