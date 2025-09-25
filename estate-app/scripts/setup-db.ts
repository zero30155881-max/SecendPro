import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 إعداد قاعدة البيانات...');

    // إنشاء الجداول
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    console.log('✅ تم إنشاء قاعدة البيانات بنجاح');

    // إضافة خزنة افتراضية
    const defaultSafe = await prisma.safe.upsert({
      where: { name: 'الخزنة الرئيسية' },
      update: {},
      create: {
        name: 'الخزنة الرئيسية',
        balance: 0
      }
    });

    console.log('✅ تم إضافة الخزنة الافتراضية');

    // إضافة إعدادات افتراضية
    const defaultSettings = await prisma.setting.upsert({
      where: { id: 'app_settings' },
      update: {},
      create: {
        id: 'app_settings',
        theme: 'dark',
        font: 16,
        pass: null
      }
    });

    console.log('✅ تم إضافة الإعدادات الافتراضية');

    console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
    console.log(`الخزنة الافتراضية: ${defaultSafe.name}`);
    console.log(`الإعدادات: ${JSON.stringify(defaultSettings)}`);

  } catch (error) {
    console.error('❌ حدث خطأ في إعداد قاعدة البيانات:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();