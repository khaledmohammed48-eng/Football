import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function requireAuth(requiredRole?: string | string[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: 'غير مصادق عليه', status: 401, session: null };
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(session.user.role)) {
      return { error: 'غير مصرح', status: 403, session: null };
    }
  }

  // Academy-scoped roles must have an academyId in their session
  const academyScopedRoles = ['ADMIN', 'COACH', 'PLAYER'];
  if (academyScopedRoles.includes(session.user.role) && !session.user.academyId) {
    return { error: 'الحساب غير مرتبط بأكاديمية', status: 403, session: null };
  }

  return { error: null, status: 200, session };
}

export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}
