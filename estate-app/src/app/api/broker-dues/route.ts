import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/broker-dues - جلب عمولات السماسرة
export async function GET(request: NextRequest) {
  try {
    const brokerDues = await prisma.brokerDue.findMany({
      where: {
        status: 'due'
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

    return NextResponse.json(brokerDues);
  } catch (error) {
    console.error('Error fetching broker dues:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العمولات' },
      { status: 500 }
    );
  }
}

// POST /api/broker-dues - إنشاء عمولة سمسار
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, brokerName, amount, dueDate } = body;

    if (!contractId || !brokerName || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const brokerDue = await prisma.brokerDue.create({
      data: {
        contractId,
        brokerName,
        amount: parseFloat(amount.toString()),
        dueDate: new Date(dueDate),
        status: 'due'
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

    await logAction('إنشاء عمولة سمسار', {
      brokerDueId: brokerDue.id,
      brokerName: brokerDue.brokerName,
      amount: brokerDue.amount,
      contractId: brokerDue.contractId
    });

    return NextResponse.json(brokerDue, { status: 201 });
  } catch (error) {
    console.error('Error creating broker due:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء العمولة' },
      { status: 500 }
    );
  }
}