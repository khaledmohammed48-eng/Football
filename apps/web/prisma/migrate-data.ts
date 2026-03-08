/**
 * One-time data migration script for multi-academy support.
 * Run once after `prisma migrate dev --name add_multi_academy`.
 *
 * Usage:
 *   node -e "require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}}); require('./prisma/migrate-data.ts')"
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting multi-academy data migration...\n');

  // 1. Create or find the default academy
  const academy = await prisma.academy.upsert({
    where: { id: 'default-academy-001' },
    update: {},
    create: {
      id: 'default-academy-001',
      name: 'الأكاديمية الرئيسية',
      city: 'الرياض',
      location: 'الرياض',
      ageGroups: JSON.stringify(['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21']),
    },
  });
  console.log(`✅ Default academy: "${academy.name}" (id: ${academy.id})`);

  // 2. Assign all existing Users (except SUPER_ADMIN) to the default academy
  const usersUpdated = await prisma.user.updateMany({
    where: { academyId: null, role: { not: 'SUPER_ADMIN' } },
    data: { academyId: academy.id },
  });
  console.log(`✅ Updated ${usersUpdated.count} users → academy`);

  // 3. Assign all existing Teams to the default academy
  const teamsUpdated = await prisma.team.updateMany({
    where: { academyId: null },
    data: { academyId: academy.id },
  });
  console.log(`✅ Updated ${teamsUpdated.count} teams → academy`);

  // 4. Assign all existing Coaches to the default academy
  const coachesUpdated = await prisma.coach.updateMany({
    where: { academyId: null },
    data: { academyId: academy.id },
  });
  console.log(`✅ Updated ${coachesUpdated.count} coaches → academy`);

  // 5. Assign all existing Players to the default academy
  const playersUpdated = await prisma.player.updateMany({
    where: { academyId: null },
    data: { academyId: academy.id },
  });
  console.log(`✅ Updated ${playersUpdated.count} players → academy`);

  // 6. Create SUPER_ADMIN user (no academyId — global access)
  const superPassword = await bcrypt.hash('SuperAdmin@123456', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@system.local' },
    update: {},
    create: {
      email: 'superadmin@system.local',
      password: superPassword,
      role: 'SUPER_ADMIN',
      academyId: null,
    },
  });
  console.log(`\n✅ SUPER_ADMIN ready: ${superAdmin.email}`);
  console.log('   Password: SuperAdmin@123456\n');

  console.log('🎉 Migration complete! All existing data is in the default academy.');
  console.log('\nNext steps:');
  console.log('  1. Login as SUPER_ADMIN at /login');
  console.log('  2. Create additional academies at /super-admin/academies/new');
  console.log('  3. Create ADMIN users for each academy at /super-admin/users');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
