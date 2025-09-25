import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/backup/restore - استعادة البيانات من النسخة الاحتياطية
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ملف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    let backupData;

    try {
      backupData = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        { error: 'ملف النسخة الاحتياطية تالف أو غير صحيح' },
        { status: 400 }
      );
    }

    if (!backupData.data) {
      return NextResponse.json(
        { error: 'تنسيق ملف النسخة الاحتياطية غير صحيح' },
        { status: 400 }
      );
    }

    // حذف جميع البيانات الحالية
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

    // استعادة البيانات
    const data = backupData.data;

    // استعادة العملاء
    if (data.customers?.length > 0) {
      await prisma.customer.createMany({ data: data.customers });
    }

    // استعادة الوحدات
    if (data.units?.length > 0) {
      await prisma.unit.createMany({ data: data.units });
    }

    // استعادة الشركاء
    if (data.partners?.length > 0) {
      await prisma.partner.createMany({ data: data.partners });
    }

    // استعادة مجموعات الشركاء
    if (data.partnerGroups?.length > 0) {
      await prisma.partnerGroup.createMany({ data: data.partnerGroups });
    }

    // استعادة الخزن
    if (data.safes?.length > 0) {
      await prisma.safe.createMany({ data: data.safes });
    }

    // استعادة السماسرة
    if (data.brokers?.length > 0) {
      await prisma.broker.createMany({ data: data.brokers });
    }

    // استعادة العقود
    if (data.contracts?.length > 0) {
      await prisma.contract.createMany({ data: data.contracts });
    }

    // استعادة الأقساط
    if (data.installments?.length > 0) {
      await prisma.installment.createMany({ data: data.installments });
    }

    // استعادة السندات
    if (data.vouchers?.length > 0) {
      await prisma.voucher.createMany({ data: data.vouchers });
    }

    // استعادة ديون الشركاء
    if (data.partnerDebts?.length > 0) {
      await prisma.partnerDebt.createMany({ data: data.partnerDebts });
    }

    // استعادة التحويلات
    if (data.transfers?.length > 0) {
      await prisma.transfer.createMany({ data: data.transfers });
    }

    // استعادة سجل التغييرات
    if (data.auditLogs?.length > 0) {
      await prisma.auditLog.createMany({ data: data.auditLogs });
    }

    return NextResponse.json({
      message: 'تم استعادة البيانات بنجاح',
      restoredRecords: {
        customers: data.customers?.length || 0,
        units: data.units?.length || 0,
        partners: data.partners?.length || 0,
        contracts: data.contracts?.length || 0,
        installments: data.installments?.length || 0,
        safes: data.safes?.length || 0,
        vouchers: data.vouchers?.length || 0,
        brokers: data.brokers?.length || 0,
        partnerDebts: data.partnerDebts?.length || 0,
        transfers: data.transfers?.length || 0,
        auditLogs: data.auditLogs?.length || 0
      }
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في استعادة البيانات' },
      { status: 500 }
    );
  }
}