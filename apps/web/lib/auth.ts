import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

type AuthUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
  academyId?: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'البريد أو الجوال', type: 'text' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) return null;

        const identifier = credentials.identifier.trim();

        // 1. Try email login (backward-compat for SUPER_ADMIN and legacy accounts)
        let user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        let displayName: string | null = null;

        // 2. Try User.mobile (for ADMIN accounts — mobile is the login identifier)
        if (!user) {
          user = await prisma.user.findFirst({
            where: { mobile: identifier, role: 'ADMIN' },
          });
        }

        // 3. Try Coach.phone — COACH accounts use phone as login (takes priority over Player)
        if (!user) {
          const coach = await prisma.coach.findFirst({
            where: { phone: identifier },
            include: { user: true },
          });
          if (coach) {
            user = coach.user;
            displayName = coach.name;
          }
        }

        // 4. Try Player.phone (lowest priority — multiple players may share a phone number)
        if (!user) {
          const player = await prisma.player.findFirst({
            where: { phone: identifier },
            include: { user: true },
          });
          if (player) {
            user = player.user;
            displayName = player.name;
          }
        }

        // Set display name for admins/super_admins
        if (user && !displayName) {
          if (user.role === 'COACH') {
            const coach = await prisma.coach.findUnique({ where: { userId: user.id }, select: { name: true } });
            displayName = coach?.name ?? (user.mobile ?? user.email);
          } else {
            displayName = user.mobile ?? user.email;
          }
        }

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: displayName ?? user.email,
          academyId: user.academyId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AuthUser;
        token.id = u.id;
        token.role = u.role;
        token.displayName = u.name ?? u.email;
        token.academyId = u.academyId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.displayName as string;
        session.user.academyId = token.academyId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
