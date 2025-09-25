import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/reset - إعادة تعيين قاعدة البيانات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirm } = body;

    if (!confirm) {
      return NextResponse.json(
        { error: 'تأكيد إعادة التعيين مطلوب' },
        { status: 400 }
      );
    }

    // حذف جميع البيانات
    await Promise.all([
      prisma.auditLog.deleteMany(),
      prisma.transfer.deleteMany(),
      prisma.partnerDebt.deleteMany(),
      prisma.broker.deleteMany(),
      prisma.voucher.deleteMany(),
      prisma.safe.deleteMany(),
      prisma.installment.deleteMany(),
      prisma.contract.deleteMany(),
      prisma.unitPartner.deleteMany(),
      prisma.partnerGroup.deleteMany(),
      prisma.unit.deleteMany(),
      prisma.partner.deleteMany(),
      prisma.customer.deleteMany()
    ]);

    // إنشاء خزنة افتراضية
    await prisma.safe.create({
      data: {
        name: 'الخزنة الرئيسية',
        balance: 0
      }
    });

    // إنشاء إعدادات افتراضية
    await prisma.setting.upsert({
      where: { id: 'app_settings' },
      update: {},
      create: {
        id: 'app_settings',
        theme: 'dark',
        font: 16
      }
    });

    return NextResponse.json({
      message: 'تم إعادة تعيين قاعدة البيانات بنجاح'
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إعادة تعيين قاعدة البيانات' },
      { status: 500 }
    );
  }
}