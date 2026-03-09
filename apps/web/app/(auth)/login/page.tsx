import { prisma } from '@/lib/prisma';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const academy = await prisma.academy.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { name: true, logoUrl: true },
  });

  return (
    <LoginForm
      academyName={academy?.name ?? 'أكاديمتنا'}
      academyLogoUrl={academy?.logoUrl ?? null}
    />
  );
}
