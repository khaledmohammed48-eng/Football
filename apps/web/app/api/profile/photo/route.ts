import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

/**
 * GET /api/profile/photo
 * Returns the current user's profile photo URL.
 *
 * PUT /api/profile/photo
 * Updates the profile photo for the current authenticated user.
 * Works for all roles: ADMIN, SUPER_ADMIN, COACH, PLAYER.
 *
 * Body: { photoUrl: string }
 * Returns: { photoUrl: string }
 */
export async function GET(request: Request) {
  const { error, status, session } = await requireAuth(['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER']);
  if (error) return errorResponse(error, status);

  const userId = session!.user.id;
  const role = session!.user.role;

  let photoUrl: string | null = null;
  let name: string | null = null;

  if (role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId }, select: { photoUrl: true, name: true } });
    photoUrl = coach?.photoUrl ?? null;
    name = coach?.name ?? null;
  } else if (role === 'PLAYER') {
    const player = await prisma.player.findUnique({ where: { userId }, select: { photoUrl: true, name: true } });
    photoUrl = player?.photoUrl ?? null;
    name = player?.name ?? null;
  } else {
    // ADMIN / SUPER_ADMIN — photo stored on User record
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true, email: true } });
    photoUrl = user?.photoUrl ?? null;
    name = user?.email ?? null;
  }

  return successResponse({ photoUrl, name });
}

export async function PUT(request: Request) {
  const { error, status, session } = await requireAuth(['SUPER_ADMIN', 'ADMIN', 'COACH', 'PLAYER']);
  if (error) return errorResponse(error, status);

  const body = await request.json().catch(() => null);
  if (!body?.photoUrl || typeof body.photoUrl !== 'string') {
    return errorResponse('photoUrl مطلوب', 400);
  }

  const { photoUrl } = body;
  const userId = session!.user.id;
  const role = session!.user.role;

  if (role === 'COACH') {
    await prisma.coach.update({ where: { userId }, data: { photoUrl } });
  } else if (role === 'PLAYER') {
    await prisma.player.update({ where: { userId }, data: { photoUrl } });
  } else {
    // ADMIN / SUPER_ADMIN — store photo on User record
    await prisma.user.update({ where: { id: userId }, data: { photoUrl } });
  }

  return successResponse({ photoUrl });
}
