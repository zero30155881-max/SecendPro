import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/backup - إنشاء نسخة احتياطية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body; // 'json' أو 'excel'

    // جلب جميع البيانات
    const [
      customers,
      units,
      partners,
      partnerGroups,
      unitPartners,
      contracts,
      installments,
      safes,
      vouchers,
      brokers,
      partnerDebts,
      transfers,
      auditLogs,
      settings
    ] = await Promise.all([
      prisma.customer.findMany(),
      prisma.unit.findMany({ include: { unitPartners: { include: { partner: true } } } }),
      prisma.partner.findMany(),
      prisma.partnerGroup.findMany({ include: { partners: true } }),
      prisma.unitPartner.findMany({ include: { partner: true, unit: true } }),
      prisma.contract.findMany({ include: { unit: true, customer: true, installments: true, vouchers: true } }),
      prisma.installment.findMany({ include: { unit: true, contract: { include: { customer: true } } } }),
      prisma.safe.findMany(),
      prisma.voucher.findMany({ include: { safe: true, contract: { include: { customer: true, unit: true } } } }),
      prisma.broker.findMany(),
      prisma.partnerDebt.findMany({ include: { payingPartner: true, owedPartner: true, unit: true } }),
      prisma.transfer.findMany({ include: { fromSafe: true, toSafe: true } }),
      prisma.auditLog.findMany(),
      prisma.setting.findMany()
    ]);

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        customers,
        units,
        partners,
        partnerGroups,
        unitPartners,
        contracts,
        installments,
        safes,
        vouchers,
        brokers,
        partnerDebts,
        transfers,
        auditLogs,
        settings
      }
    };

    if (type === 'excel') {
      // إنشاء ملف Excel (سنستخدم CSV كتبديل بسيط)
      const csv = generateCSV(backupData);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=backup-${new Date().toISOString().slice(0, 10)}.csv`
        }
      });
    } else {
      // إنشاء ملف JSON
      return new Response(JSON.stringify(backupData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=backup-${new Date().toISOString().slice(0, 10)}.json`
        }
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

function generateCSV(backupData: any): string {
  let csv = 'data:text/csv;charset=utf-8,';
  csv += 'Backup Data Export\n';
  csv += `Version: ${backupData.version}\n`;
  csv += `Timestamp: ${backupData.timestamp}\n\n`;

  // إضافة كل جدول
  Object.entries(backupData.data).forEach(([tableName, data]: [string, any]) => {
    if (Array.isArray(data) && data.length > 0) {
      csv += `${tableName.toUpperCase()}\n`;

      // رؤوس الأعمدة
      const headers = Object.keys(data[0]);
      csv += headers.join(',') + '\n';

      // البيانات
      data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        });
        csv += values.join(',') + '\n';
      });

      csv += '\n';
    }
  });

  return csv;
}