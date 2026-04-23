const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. App Settings
  await prisma.appSettings.upsert({
    where: { key: 'SYSTEM_NAME' },
    update: {},
    create: { key: 'SYSTEM_NAME', value: 'Nexus Production Engine' },
  });

  // 2. Root Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@corp.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Root Admin',
      role: 'admin',
      status: 'active',
    },
  });

  // 3. Default Ticker
  await prisma.ticker.create({
    data: {
      text: 'Welcome to Nexus Digital Signage - Production Ready',
      speed: 10,
      direction: 'left',
      fontColor: '#FFFFFF',
      backgroundColor: '#CC0000',
    }
  });

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
