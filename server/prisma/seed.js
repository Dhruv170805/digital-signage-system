const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. App Settings - Manual Check/Create to avoid transaction requirements on standalone MongoDB
  const systemName = await prisma.appSettings.findUnique({ where: { key: 'SYSTEM_NAME' } });
  if (!systemName) {
    await prisma.appSettings.create({
      data: { key: 'SYSTEM_NAME', value: 'Nexus Production Engine' },
    });
  }

  // 2. Root Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@corp.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Root Admin',
        role: 'admin',
        status: 'active',
      },
    });
    console.log('👤 Admin user created.');
  } else {
    console.log('👤 Admin user already exists.');
  }

  // 3. Default Ticker
  const tickerCount = await prisma.ticker.count();
  if (tickerCount === 0) {
    await prisma.ticker.create({
      data: {
        text: 'Welcome to Nexus Digital Signage - Production Ready',
        speed: 10,
        direction: 'left',
        fontColor: '#FFFFFF',
        backgroundColor: '#CC0000',
      }
    });
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
