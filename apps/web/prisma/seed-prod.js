/**
 * Production seed — only creates the SUPER_ADMIN account.
 * Safe to run on every deploy (uses upsert).
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@system.local';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123456';

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super admin ready:', user.email);
}

main()
  .catch((e) => {
    console.error('Seed error:', e.message);
    // Non-fatal — don't crash the server
  })
  .finally(() => prisma.$disconnect());
