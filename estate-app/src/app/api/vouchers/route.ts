import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/vouchers - الحصول على جميع السندات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const safeId = searchParams.get('safeId');
    const type = searchParams.get('type');

    let where: any = {};

    if (safeId) {
      where.safeId = safeId;
    }

    if (type) {
      where.type = type;
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        safe: true,
        contract: {
          include: {
            customer: true,
            unit: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السندات' },
      { status: 500 }
    );
  }
}

// POST /api/vouchers - إضافة سند جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, date, amount, safeId, description, payer, beneficiary, linkedRef, contractId } = body;

    if (!type || !date || !amount || !safeId || !description) {
      return NextResponse.json(
        { error: 'جميع البيانات المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    // التحقق من وجود الخزنة
    const safe = await prisma.safe.findUnique({
      where: { id: safeId }
    });

    if (!safe) {
      return NextResponse.json(
        { error: 'الخزنة المحددة غير موجودة' },
        { status: 400 }
      );
    }

    // التحقق من رصيد الخزنة للسندات الصرف
    if (type === 'payment' && safe.balance < amount) {
      return NextResponse.json(
        { error: 'رصيد الخزنة غير كافي' },
        { status: 400 }
      );
    }

    const voucher = await prisma.voucher.create({
      data: {
        type,
        date: new Date(date),
        amount,
        safeId,
        description,
        payer,
        beneficiary,
        linkedRef,
        contractId
      }
    });

    // تحديث رصيد الخزنة
    const balanceChange = type === 'receipt' ? amount : -amount;
    await prisma.safe.update({
      where: { id: safeId },
      data: { balance: { increment: balanceChange } }
    });

    // تسجيل العملية
    await logAction('إضافة سند جديد', { id: voucher.id, type: voucher.type, amount: voucher.amount });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة السند' },
      { status: 500 }
    );
  }
}