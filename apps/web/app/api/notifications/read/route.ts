import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// PATCH /api/notifications/read  — mark all (or specific) as read
// body: { ids?: string[] }  — if omitted, marks ALL unread as read
export async function PATCH(request: Request) {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const body = await request.json().catch(() => ({})) as { ids?: string[] };

  if (body.ids && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: session!.user.id, id: { in: body.ids } },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: session!.user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return successResponse({ ok: true });
}
