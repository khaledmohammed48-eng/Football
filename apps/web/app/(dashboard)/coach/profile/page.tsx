import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CoachProfileClient } from './coach-profile-client';

export default async function CoachProfilePage() {
  const session = await getServerSession(authOptions);

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user.id },
    include: {
      team: { select: { id: true, name: true } },
      user: { select: { mobile: true } },
    },
  });

  if (!coach) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">👨‍💼</div>
        <p className="text-gray-500">لم يتم إنشاء ملفك الشخصي بعد. تواصل مع المدير.</p>
      </div>
    );
  }

  return (
    <CoachProfileClient
      name={coach.name}
      photoUrl={coach.photoUrl}
      phone={coach.phone}
      mobile={coach.user.mobile}
      team={coach.team}
    />
  );
}
