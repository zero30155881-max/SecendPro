import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
  try {
    console.log('🔄 بدء النسخ الاحتياطي...');

    // جلب جميع البيانات
    const data = await prisma.$transaction(async (tx) => {
      const customers = await tx.customer.findMany();
      const units = await tx.unit.findMany();
      const partners = await tx.partner.findMany();
      const contracts = await tx.contract.findMany();
      const installments = await tx.installment.findMany();
      const safes = await tx.safe.findMany();
      const vouchers = await tx.voucher.findMany();
      const brokers = await tx.broker.findMany();
      const partnerDebts = await tx.partnerDebt.findMany();
      const settings = await tx.setting.findMany();

      return {
        customers,
        units,
        partners,
        contracts,
        installments,
        safes,
        vouchers,
        brokers,
        partnerDebts,
        settings,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
    });

    // إنشاء اسم الملف
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'backups', filename);

    // إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجود
    const backupDir = path.dirname(filepath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // حفظ النسخة الاحتياطية
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`✅ تم إنشاء النسخة الاحتياطية: ${filepath}`);
    console.log(`📊 حجم البيانات:`);
    console.log(`   - العملاء: ${data.customers.length}`);
    console.log(`   - الوحدات: ${data.units.length}`);
    console.log(`   - الشركاء: ${data.partners.length}`);
    console.log(`   - العقود: ${data.contracts.length}`);
    console.log(`   - الأقساط: ${data.installments.length}`);
    console.log(`   - السندات: ${data.vouchers.length}`);

  } catch (error) {
    console.error('❌ حدث خطأ في النسخ الاحتياطي:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function restore(backupFile: string) {
  try {
    console.log('🔄 بدء الاستعادة...');

    if (!fs.existsSync(backupFile)) {
      console.error('❌ ملف النسخة الاحتياطية غير موجود');
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📁 ملف النسخة الاحتياطية: ${backupFile}`);
    console.log(`📅 تاريخ النسخة: ${backupData.backupDate}`);

    // تأكيد من المستخدم
    console.log('⚠️  سيتم حذف جميع البيانات الحالية واستبدالها بالنسخة الاحتياطية');
    console.log('هل تريد المتابعة؟ (y/N)');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', async (answer: string) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ تم إلغاء الاستعادة');
        rl.close();
        return;
      }

      rl.close();

      await prisma.$transaction(async (tx) => {
        // حذف جميع البيانات الحالية
        await tx.installment.deleteMany({});
        await tx.voucher.deleteMany({});
        await tx.contract.deleteMany({});
        await tx.unitPartner.deleteMany({});
        await tx.partnerDebt.deleteMany({});
        await tx.brokerDue.deleteMany({});
        await tx.auditLog.deleteMany({});
        await tx.partnerGroupPartner.deleteMany({});
        await tx.partnerGroup.deleteMany({});
        await tx.unit.deleteMany({});
        await tx.customer.deleteMany({});
        await tx.partner.deleteMany({});
        await tx.broker.deleteMany({});
        await tx.safe.deleteMany({});
        await tx.setting.deleteMany({});

        console.log('🗑️  تم حذف البيانات الحالية');

        // استعادة البيانات
        if (backupData.customers.length > 0) {
          await tx.customer.createMany({ data: backupData.customers });
        }
        if (backupData.units.length > 0) {
          await tx.unit.createMany({ data: backupData.units });
        }
        if (backupData.partners.length > 0) {
          await tx.partner.createMany({ data: backupData.partners });
        }
        if (backupData.contracts.length > 0) {
          await tx.contract.createMany({ data: backupData.contracts });
        }
        if (backupData.installments.length > 0) {
          await tx.installment.createMany({ data: backupData.installments });
        }
        if (backupData.safes.length > 0) {
          await tx.safe.createMany({ data: backupData.safes });
        }
        if (backupData.vouchers.length > 0) {
          await tx.voucher.createMany({ data: backupData.vouchers });
        }
        if (backupData.brokers.length > 0) {
          await tx.broker.createMany({ data: backupData.brokers });
        }
        if (backupData.partnerDebts.length > 0) {
          await tx.partnerDebt.createMany({ data: backupData.partnerDebts });
        }
        if (backupData.settings.length > 0) {
          await tx.setting.createMany({ data: backupData.settings });
        }

        console.log('✅ تم استعادة البيانات');
      });

      console.log('🎉 تمت الاستعادة بنجاح!');
    });

  } catch (error) {
    console.error('❌ حدث خطأ في الاستعادة:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل النسخ الاحتياطي إذا لم يتم تمرير ملف
if (process.argv.length < 3) {
  backup();
} else {
  const backupFile = process.argv[2];
  restore(backupFile);
}