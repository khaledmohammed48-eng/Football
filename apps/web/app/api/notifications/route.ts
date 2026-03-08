import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/notifications — last 30 notifications for the current user
export async function GET() {
  const { error, status, session } = await requireAuth();
  if (error) return errorResponse(error, status);

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session!.user.id, isRead: false },
  });

  return successResponse({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}
