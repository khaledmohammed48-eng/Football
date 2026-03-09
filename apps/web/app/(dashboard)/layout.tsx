import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { InactivePlayerBanner } from '@/components/player/inactive-player-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Fetch academy name + logo for the sidebar title (null for SUPER_ADMIN)
  let academyName: string | undefined;
  let academyLogoUrl: string | null = null;
  if (session.user.academyId) {
    const academy = await prisma.academy.findUnique({
      where: { id: session.user.academyId },
      select: { name: true, logoUrl: true },
    });
    academyName = academy?.name;
    academyLogoUrl = academy?.logoUrl ?? null;
  }

  // Fetch profile photo for sidebar avatar
  let sidebarPhotoUrl: string | null = null;
  const role = session.user.role;
  if (role === 'COACH') {
    const coach = await prisma.coach.findUnique({
      where: { userId: session.user.id },
      select: { photoUrl: true },
    });
    sidebarPhotoUrl = coach?.photoUrl ?? null;
  } else if (role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { photoUrl: true },
    });
    sidebarPhotoUrl = player?.photoUrl ?? null;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { photoUrl: true },
    });
    sidebarPhotoUrl = user?.photoUrl ?? null;
  }

  // For PLAYER role: check if account is inactive or subscription expired
  let playerStatus: {
    isActive: boolean;
    subscriptionEnd: string | null;
    playerName: string;
    adminContact: string | null;
  } | null = null;

  if (session.user.role === 'PLAYER') {
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: {
        isActive: true,
        subscriptionEnd: true,
        name: true,
        academyId: true,
      },
    });

    if (player) {
      const isExpired =
        player.subscriptionEnd !== null && player.subscriptionEnd < new Date();
      const isDeactivated = !player.isActive;

      if (isDeactivated || isExpired) {
        // Fetch academy admin email for contact info
        let adminEmail: string | null = null;
        if (player.academyId) {
          const adminUser = await prisma.user.findFirst({
            where: { academyId: player.academyId, role: 'ADMIN' },
            select: { email: true },
          });
          adminEmail = adminUser?.email ?? null;
        }

        playerStatus = {
          isActive: player.isActive,
          subscriptionEnd: player.subscriptionEnd
            ? player.subscriptionEnd.toISOString()
            : null,
          playerName: player.name,
          adminContact: adminEmail,
        };
      }
    }
  }

  return (
    <AuthSessionProvider>
      <DashboardShell
        role={session.user.role}
        userEmail={session.user.email}
        displayName={session.user.name ?? session.user.email}
        academyName={academyName}
        academyLogoUrl={academyLogoUrl}
        photoUrl={sidebarPhotoUrl}
      >
        {children}
      </DashboardShell>
      {/* Inactive / expired subscription modal — shown on every page load for affected players */}
      {playerStatus && (
        <InactivePlayerBanner
          isActive={playerStatus.isActive}
          subscriptionEnd={playerStatus.subscriptionEnd}
          playerName={playerStatus.playerName}
          adminContact={playerStatus.adminContact}
        />
      )}
    </AuthSessionProvider>
  );
}
