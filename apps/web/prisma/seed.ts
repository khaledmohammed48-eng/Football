import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const academies = [
  { name: 'أكاديمية النصر', city: 'الرياض', ageGroups: ['U8', 'U10', 'U12', 'U14', 'U16'] },
  { name: 'أكاديمية الهلال', city: 'الرياض', ageGroups: ['U10', 'U12', 'U14', 'U16', 'U18'] },
  { name: 'أكاديمية الاتحاد', city: 'جدة',    ageGroups: ['U8', 'U10', 'U12', 'U14'] },
];

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── 1. Super Admin ────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@academy.com' },
    update: {},
    create: {
      email: 'super@academy.com',
      password: await hash('Super@123456'),
      role: 'SUPER_ADMIN',
      mobile: '0500000000',
    },
  });

  console.log('\n✅ Super Admin:');
  console.log('   Email:    super@academy.com');
  console.log('   Password: Super@123456');
  console.log('   Mobile:   0500000000');
  console.log('   ID:', superAdmin.id);

  // ── 2. Academies + one Admin each ─────────────────────────────────────────
  console.log('\n✅ Academies & Admins:');

  for (let i = 0; i < academies.length; i++) {
    const { name, city, ageGroups } = academies[i];

    const academy = await prisma.academy.upsert({
      where: { id: `seed-academy-${i + 1}` },
      update: { name, city, ageGroups: JSON.stringify(ageGroups) },
      create: {
        id: `seed-academy-${i + 1}`,
        name,
        city,
        ageGroups: JSON.stringify(ageGroups),
      },
    });

    const adminEmail = `admin${i + 1}@academy.com`;
    const adminPassword = `Admin${i + 1}@123456`;
    const adminMobile = `05${String(10000000 + i + 1).slice(1)}`;

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: await hash(adminPassword),
        role: 'ADMIN',
        mobile: adminMobile,
        academyId: academy.id,
      },
    });

    console.log(`\n   [${name}] — ${city}`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Mobile:   ${adminMobile}`);
    console.log(`   Academy ID: ${academy.id}`);
  }

  console.log('\n🎉 Seed complete.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
