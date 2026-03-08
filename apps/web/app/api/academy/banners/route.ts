import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// Accessible by ADMIN, COACH, and PLAYER — returns banners for their academy
export async function GET() {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  let academyId: string | null = session!.user.academyId ?? null;

  // For players/coaches without academyId on the token, look it up via their profile
  if (!academyId) {
    if (session!.user.role === 'COACH') {
      const coach = await prisma.coach.findUnique({ where: { userId: session!.user.id }, select: { academyId: true } });
      academyId = coach?.academyId ?? null;
    } else if (session!.user.role === 'PLAYER') {
      const player = await prisma.player.findUnique({ where: { userId: session!.user.id }, select: { academyId: true } });
      academyId = player?.academyId ?? null;
    }
  }

  if (!academyId) return successResponse([]);

  const academy = await prisma.academy.findUnique({
    where: { id: academyId },
    select: { banners: true },
  });

  if (!academy) return successResponse([]);

  const banners = JSON.parse(academy.banners) as { url: string; title?: string; link?: string }[];
  return successResponse(banners);
}
