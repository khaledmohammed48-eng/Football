import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
  const { error, status, session } = await requireAuth('COACH');
  if (error) return errorResponse(error, status);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    include: {
      team: {
        include: {
          players: {
            include: { attributes: true },
            orderBy: { name: 'asc' },
          },
        },
      },
    },
  });

  if (!coach?.team) return errorResponse('لم يتم تعيينك في فريق بعد', 404);

  const team = coach.team;

  return successResponse({
    id: team.id,
    name: team.name,
    players: team.players.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      photoUrl: p.photoUrl,
      attributes: p.attributes
        ? {
            speed: p.attributes.speed,
            passing: p.attributes.passing,
            shooting: p.attributes.shooting,
            dribbling: p.attributes.dribbling,
            defense: p.attributes.defense,
            stamina: p.attributes.stamina,
          }
        : null,
    })),
  });
}
