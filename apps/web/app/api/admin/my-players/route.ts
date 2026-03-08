import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

/**
 * GET /api/admin/my-players
 * Returns all active players belonging to the admin's academy,
 * sorted by position then name — used by the lineup builder.
 */
export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  const academyId = session!.user.academyId!;

  const players = await prisma.player.findMany({
    where: { academyId, isActive: true },
    select: {
      id: true,
      name: true,
      position: true,
      photoUrl: true,
      team: { select: { name: true } },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });

  return successResponse(
    players.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      photoUrl: p.photoUrl,
      teamName: p.team?.name ?? null,
    }))
  );
}
