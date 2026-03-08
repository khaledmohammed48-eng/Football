import { prisma } from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const { error, status, session } = await requireAuth(['ADMIN', 'COACH']);
  if (error) return errorResponse(error, status);

  const note = await prisma.coachNote.findUnique({ where: { id: params.noteId } });
  if (!note) return errorResponse('الملاحظة غير موجودة', 404);

  // Coaches can only delete their own notes
  if (session!.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session!.user.id },
    });
    if (note.coachId !== coach?.id) {
      return errorResponse('لا يمكنك حذف ملاحظات مدرب آخر', 403);
    }
  }

  await prisma.coachNote.delete({ where: { id: params.noteId } });
  return successResponse({ message: 'تم حذف الملاحظة' });
}
