import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/partner-debts - جلب ديون الشركاء
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const partnerDebts = await prisma.partnerDebt.findMany({
      where,
      include: {
        payingPartner: true,
        owedPartner: true,
        unit: true
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(partnerDebts);
  } catch (error) {
    console.error('Error fetching partner debts:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب ديون الشركاء' },
      { status: 500 }
    );
  }
}

// POST /api/partner-debts - إنشاء دين شريك
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, payingPartnerId, owedPartnerId, amount, dueDate, status } = body;

    if (!unitId || !payingPartnerId || !owedPartnerId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const partnerDebt = await prisma.partnerDebt.create({
      data: {
        unitId,
        payingPartnerId,
        owedPartnerId,
        amount: parseFloat(amount.toString()),
        dueDate: new Date(dueDate),
        status: status || 'غير مدفوع'
      },
      include: {
        payingPartner: true,
        owedPartner: true,
        unit: true
      }
    });

    await logAction('إنشاء دين شريك', {
      partnerDebtId: partnerDebt.id,
      payingPartner: partnerDebt.payingPartner.name,
      owedPartner: partnerDebt.owedPartner.name,
      amount: partnerDebt.amount
    });

    return NextResponse.json(partnerDebt, { status: 201 });
  } catch (error) {
    console.error('Error creating partner debt:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الدين' },
      { status: 500 }
    );
  }
}