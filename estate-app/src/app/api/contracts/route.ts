import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/contracts - جلب جميع العقود
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const unitId = searchParams.get('unitId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (unitId) where.unitId = unitId;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          unit: true,
          customer: true,
          installments: true,
          vouchers: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.contract.count({ where })
    ]);

    return NextResponse.json({
      contracts,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العقود' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - إنشاء عقد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      unitId,
      customerId,
      totalPrice,
      downPayment,
      discountAmount,
      maintenanceDeposit,
      brokerName,
      brokerPercent,
      brokerAmount,
      commissionSafeId,
      type,
      count,
      extraAnnual,
      annualPaymentValue,
      start
    } = body;

    // التحقق من صحة البيانات
    if (!unitId || !customerId || !totalPrice || !start) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // التحقق من وجود الوحدة والعميل
    const [unit, customer] = await Promise.all([
      prisma.unit.findUnique({ where: { id: unitId } }),
      prisma.customer.findUnique({ where: { id: customerId } })
    ]);

    if (!unit || !customer) {
      return NextResponse.json(
        { error: 'الوحدة أو العميل غير موجود' },
        { status: 404 }
      );
    }

    // إنشاء العقد
    const contract = await prisma.contract.create({
      data: {
        code,
        unitId,
        customerId,
        totalPrice: parseFloat(totalPrice.toString()),
        downPayment: parseFloat(downPayment.toString()),
        discountAmount: parseFloat(discountAmount.toString()),
        maintenanceDeposit: parseFloat(maintenanceDeposit.toString()),
        brokerName: brokerName || null,
        brokerPercent: parseFloat(brokerPercent.toString()),
        brokerAmount: parseFloat(brokerAmount.toString()),
        commissionSafeId: commissionSafeId || null,
        type,
        count: parseInt(count.toString()),
        extraAnnual: parseInt(extraAnnual.toString()),
        annualPaymentValue: parseFloat(annualPaymentValue.toString()),
        start: new Date(start)
      },
      include: {
        unit: true,
        customer: true
      }
    });

    // تسجيل العملية
    await logAction('إنشاء عقد جديد', {
      contractId: contract.id,
      code: contract.code,
      unitId: contract.unitId,
      customerId: contract.customerId
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء العقد' },
      { status: 500 }
    );
  }
}