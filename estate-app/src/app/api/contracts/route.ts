import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/contracts - الحصول على جميع العقود
export async function GET(request: NextRequest) {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        unit: {
          include: {
            unitPartners: {
              include: {
                partner: true
              }
            }
          }
        },
        customer: true,
        installments: true,
        brokerDues: {
          include: {
            broker: true
          }
        },
        vouchers: {
          include: {
            safe: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العقود' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - إضافة عقد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unitId,
      customerId,
      totalPrice,
      downPayment,
      discountAmount,
      maintenanceDeposit,
      brokerName,
      brokerPercent,
      commissionSafeId,
      type,
      count,
      extraAnnual,
      annualPaymentValue,
      start
    } = body;

    if (!unitId || !customerId || !totalPrice) {
      return NextResponse.json(
        { error: 'جميع البيانات المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    // التحقق من وجود الوحدة والعميل
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!unit || !customer) {
      return NextResponse.json(
        { error: 'الوحدة أو العميل غير موجود' },
        { status: 400 }
      );
    }

    // التحقق من حالة الوحدة
    if (unit.status !== 'متاحة' && unit.status !== 'محجوزة') {
      return NextResponse.json(
        { error: 'لا يمكن إنشاء عقد لهذه الوحدة' },
        { status: 400 }
      );
    }

    // إنشاء كود العقد
    const contractCount = await prisma.contract.count();
    const code = `CTR-${String(contractCount + 1).padStart(5, '0')}`;

    // حساب مبلغ العمولة
    const brokerAmount = brokerPercent ? (totalPrice * brokerPercent) / 100 : 0;

    const contract = await prisma.contract.create({
      data: {
        code,
        unitId,
        customerId,
        totalPrice,
        downPayment: downPayment || 0,
        discountAmount: discountAmount || 0,
        maintenanceDeposit: maintenanceDeposit || 0,
        brokerName,
        brokerPercent: brokerPercent || 0,
        brokerAmount,
        commissionSafeId,
        type: type || 'installment',
        count: count || 0,
        extraAnnual: extraAnnual || 0,
        annualPaymentValue: annualPaymentValue || 0,
        start: new Date(start)
      }
    });

    // إنشاء سند القبض للمقدم
    if (downPayment && downPayment > 0) {
      await prisma.voucher.create({
        data: {
          type: 'receipt',
          date: new Date(start),
          amount: downPayment,
          safeId: commissionSafeId,
          description: `مقدم عقد للوحدة ${unit.code}`,
          payer: customer.name,
          linkedRef: contract.id
        }
      });

      // تحديث رصيد الخزنة
      await prisma.safe.update({
        where: { id: commissionSafeId },
        data: { balance: { increment: downPayment } }
      });
    }

    // إنشاء عمولة السمسار إذا كانت موجودة
    if (brokerAmount > 0 && commissionSafeId) {
      await prisma.brokerDue.create({
        data: {
          contractId: contract.id,
          brokerName: brokerName || 'سمسار غير محدد',
          amount: brokerAmount,
          dueDate: new Date(start),
          status: 'due'
        }
      });
    }

    // تحديث حالة الوحدة
    await prisma.unit.update({
      where: { id: unitId },
      data: { status: 'مباعة' }
    });

    // تسجيل العملية
    await logAction('إنشاء عقد جديد', {
      contractId: contract.id,
      unitId: unit.id,
      customerId: customer.id,
      price: totalPrice
    });

    // إرجاع العقد مع جميع التفاصيل
    const contractWithDetails = await prisma.contract.findUnique({
      where: { id: contract.id },
      include: {
        unit: {
          include: {
            unitPartners: {
              include: {
                partner: true
              }
            }
          }
        },
        customer: true,
        installments: true,
        brokerDues: {
          include: {
            broker: true
          }
        },
        vouchers: {
          include: {
            safe: true
          }
        }
      }
    });

    return NextResponse.json(contractWithDetails, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء العقد' },
      { status: 500 }
    );
  }
}