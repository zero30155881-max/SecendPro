import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, filters } = body;

    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date('2000-01-01');
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    switch (reportId) {
      case 'payments_monthly': {
        const installments = await prisma.installment.findMany({
          where: {
            status: { in: ['مدفوع', 'مدفوع جزئياً'] },
            paymentDate: {
              gte: dateFrom,
              lte: dateTo
            }
          },
          include: {
            contract: {
              include: {
                unit: true,
                customer: true
              }
            }
          }
        });

        const monthlyData = installments.reduce((acc: any, installment) => {
          const month = installment.paymentDate?.toISOString().slice(0, 7) || 'غير محدد';
          if (!acc[month]) {
            acc[month] = { month, total: 0, count: 0 };
          }
          acc[month].total += installment.amount;
          acc[month].count += 1;
          return acc;
        }, {});

        return NextResponse.json({
          title: 'مدفوعات شهرية',
          headers: ['الشهر', 'إجمالي المدفوعات', 'عدد الدفعات'],
          rows: Object.values(monthlyData),
          hasChart: true,
          chartData: {
            labels: Object.values(monthlyData).map((d: any) => d.month),
            datasets: [{
              label: 'إجمالي المدفوعات',
              data: Object.values(monthlyData).map((d: any) => d.total)
            }]
          }
        });
      }

      case 'cashflow': {
        const vouchers = await prisma.voucher.findMany({
          where: {
            date: {
              gte: dateFrom,
              lte: dateTo
            }
          },
          include: {
            safe: true,
            contract: {
              include: {
                unit: true,
                customer: true
              }
            }
          }
        });

        const receipts = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0);
        const payments = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0);

        return NextResponse.json({
          title: 'التدفقات النقدية العامة',
          headers: ['النوع', 'المبلغ', 'التفاصيل'],
          rows: [
            ['إجمالي القبض', receipts, `${vouchers.filter(v => v.type === 'receipt').length} سند قبض`],
            ['إجمالي الصرف', payments, `${vouchers.filter(v => v.type === 'payment').length} سند صرف`],
            ['صافي التدفق', receipts - payments, receipts >= payments ? 'فائض' : 'عجز']
          ],
          hasChart: true,
          chartData: {
            labels: ['قبض', 'صرف'],
            datasets: [{
              data: [receipts, payments],
              backgroundColor: ['#10b981', '#ef4444']
            }]
          }
        });
      }

      case 'units_status': {
        const units = await prisma.unit.findMany();
        const contracts = await prisma.contract.findMany();

        const available = units.filter(u => !contracts.some(c => c.unitId === u.id)).length;
        const sold = contracts.length;
        const reserved = units.filter(u => u.status === 'محجوزة').length;

        return NextResponse.json({
          title: 'حالة الوحدات',
          headers: ['الحالة', 'العدد', 'النسبة المئوية'],
          rows: [
            ['متاحة', available, `${((available / units.length) * 100).toFixed(1)}%`],
            ['مباعة', sold, `${((sold / units.length) * 100).toFixed(1)}%`],
            ['محجوزة', reserved, `${((reserved / units.length) * 100).toFixed(1)}%`]
          ],
          hasChart: true,
          chartData: {
            labels: ['متاحة', 'مباعة', 'محجوزة'],
            datasets: [{
              data: [available, sold, reserved],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
            }]
          }
        });
      }

      case 'partner_summary': {
        const partners = await prisma.partner.findMany();
        const rows = await Promise.all(
          partners.map(async (partner) => {
            const unitPartners = await prisma.unitPartner.findMany({
              where: { partnerId: partner.id },
              include: { unit: true }
            });

            const totalPercent = unitPartners.reduce((sum, up) => sum + up.percent, 0);

            // حساب الدخل والمصروفات (مبسط)
            const contracts = await prisma.contract.findMany({
              include: {
                unit: true,
                vouchers: true
              }
            });

            const partnerContracts = contracts.filter(c =>
              unitPartners.some(up => up.unitId === c.unitId)
            );

            const totalContractValue = partnerContracts.reduce((sum, c) =>
              sum + (c.totalPrice * (unitPartners.find(up => up.unitId === c.unitId)?.percent || 0) / 100), 0
            );

            const totalPaid = partnerContracts.reduce((sum, c) => {
              const partnerPercent = unitPartners.find(up => up.unitId === c.unitId)?.percent || 0;
              const contractPaid = c.vouchers.filter(v => v.type === 'receipt').reduce((s, v) => s + v.amount, 0);
              return sum + (contractPaid * partnerPercent / 100);
            }, 0);

            return [
              partner.name,
              unitPartners.length,
              `${totalPercent}%`,
              totalContractValue,
              totalPaid,
              totalContractValue - totalPaid,
              totalPaid >= totalContractValue ? 'مكتمل' : 'جاري'
            ];
          })
        );

        return NextResponse.json({
          title: 'ملخص أرباح الشركاء',
          headers: ['الشريك', 'عدد الوحدات', 'إجمالي النسبة', 'قيمة العقود', 'إجمالي المدفوع', 'المتبقي', 'الحالة'],
          rows
        });
      }

      case 'inst_due': {
        const installments = await prisma.installment.findMany({
          where: {
            status: { in: ['غير مدفوع', 'مدفوع جزئياً'] },
            dueDate: {
              gte: new Date(),
              lte: dateTo
            }
          },
          include: {
            contract: {
              include: {
                unit: true,
                customer: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        });

        const rows = installments.map(inst => [
          inst.contract?.unit?.code || '—',
          inst.contract?.customer?.name || '—',
          inst.type,
          inst.amount,
          inst.dueDate?.toISOString().split('T')[0] || '',
          inst.status
        ]);

        return NextResponse.json({
          title: 'الأقساط المستحقة',
          headers: ['الوحدة', 'العميل', 'نوع القسط', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة'],
          rows
        });
      }

      case 'inst_overdue': {
        const installments = await prisma.installment.findMany({
          where: {
            status: { in: ['غير مدفوع', 'مدفوع جزئياً'] },
            dueDate: {
              lt: new Date()
            }
          },
          include: {
            contract: {
              include: {
                unit: true,
                customer: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        });

        const rows = installments.map(inst => [
          inst.contract?.unit?.code || '—',
          inst.contract?.customer?.name || '—',
          inst.type,
          inst.amount,
          inst.dueDate?.toISOString().split('T')[0] || '',
          Math.ceil((new Date().getTime() - new Date(inst.dueDate || '').getTime()) / (1000 * 60 * 60 * 24)),
          'متأخر'
        ]);

        return NextResponse.json({
          title: 'الأقساط المتأخرة',
          headers: ['الوحدة', 'العميل', 'نوع القسط', 'المبلغ', 'تاريخ الاستحقاق', 'عدد الأيام المتأخرة', 'الحالة'],
          rows
        });
      }

      default:
        return NextResponse.json(
          { error: 'نوع التقرير غير مدعوم' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء التقرير' },
      { status: 500 }
    );
  }
}