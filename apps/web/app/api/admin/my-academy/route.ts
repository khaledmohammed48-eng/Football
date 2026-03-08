import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

interface Banner { url: string; title?: string; link?: string; }

export async function GET() {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  if (!session!.user.academyId) return errorResponse('لا توجد أكاديمية مرتبطة بحسابك', 404);

  const academy = await prisma.academy.findUnique({
    where: { id: session!.user.academyId },
    select: { id: true, name: true, logoUrl: true, city: true, location: true, ageGroups: true, banners: true },
  });

  if (!academy) return errorResponse('الأكاديمية غير موجودة', 404);

  return successResponse({
    ...academy,
    ageGroups: JSON.parse(academy.ageGroups) as string[],
    banners: JSON.parse(academy.banners) as Banner[],
  });
}

export async function PUT(request: Request) {
  const { error, status, session } = await requireAuth('ADMIN');
  if (error) return errorResponse(error, status);

  if (!session!.user.academyId) return errorResponse('لا توجد أكاديمية مرتبطة بحسابك', 404);

  const body = await request.json() as { logoUrl?: string | null; banners?: Banner[] };

  const updates: { logoUrl?: string | null; banners?: string } = {};

  if ('logoUrl' in body) {
    updates.logoUrl = body.logoUrl ?? null;
  }

  if (body.banners !== undefined) {
    if (!Array.isArray(body.banners)) return errorResponse('banners يجب أن تكون مصفوفة', 400);
    // Validate each banner has a url
    for (const b of body.banners) {
      if (!b.url || typeof b.url !== 'string') return errorResponse('كل بانر يجب أن يحتوي على رابط صورة', 400);
    }
    updates.banners = JSON.stringify(body.banners);
  }

  if (Object.keys(updates).length === 0) return errorResponse('لا توجد بيانات للتحديث', 400);

  const academy = await prisma.academy.update({
    where: { id: session!.user.academyId },
    data: updates,
    select: { id: true, name: true, logoUrl: true, city: true, location: true, ageGroups: true, banners: true },
  });

  return successResponse({
    ...academy,
    ageGroups: JSON.parse(academy.ageGroups) as string[],
    banners: JSON.parse(academy.banners) as Banner[],
  });
}
