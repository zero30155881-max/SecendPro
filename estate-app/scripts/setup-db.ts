import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 إعداد قاعدة البيانات...');

    // SQLite لا يحتاج إلى extensions
    console.log('✅ تم إنشاء قاعدة البيانات بنجاح');

    // إضافة خزنة افتراضية
    const existingSafe = await prisma.safe.findFirst({
      where: { name: 'الخزنة الرئيسية' }
    });

    if (!existingSafe) {
      await prisma.safe.create({
        data: {
          name: 'الخزنة الرئيسية',
          balance: 0
        }
      });
    }

    console.log('✅ تم إضافة الخزنة الافتراضية');

    // إضافة إعدادات افتراضية
    const existingSettings = await prisma.setting.findFirst({
      where: { id: 'app_settings' }
    });

    if (!existingSettings) {
      await prisma.setting.create({
        data: {
          id: 'app_settings',
          theme: 'dark',
          font: 16,
          pass: null
        }
      });
    }

    console.log('✅ تم إضافة الإعدادات الافتراضية');

    console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ حدث خطأ في إعداد قاعدة البيانات:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();