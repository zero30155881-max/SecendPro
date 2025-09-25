import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brokerDueId = params.id;

    if (!brokerDueId) {
      return NextResponse.json(
        { error: 'معرف العمولة مطلوب' },
        { status: 400 }
      );
    }

    const brokerDue = await prisma.brokerDue.findUnique({
      where: { id: brokerDueId },
      include: {
        contract: {
          include: {
            unit: true,
            customer: true
          }
        }
      }
    });

    if (!brokerDue) {
      return NextResponse.json(
        { error: 'العمولة غير موجودة' },
        { status: 404 }
      );
    }

    if (brokerDue.status !== 'due') {
      return NextResponse.json(
        { error: 'العمولة مدفوعة بالفعل' },
        { status: 400 }
      );
    }

    // تحديث حالة العمولة
    const updatedBrokerDue = await prisma.brokerDue.update({
      where: { id: brokerDueId },
      data: {
        status: 'paid',
        paymentDate: new Date()
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

    await logAction('دفع عمولة سمسار', {
      brokerDueId: updatedBrokerDue.id,
      brokerName: updatedBrokerDue.brokerName,
      amount: updatedBrokerDue.amount,
      contractId: updatedBrokerDue.contractId
    });

    return NextResponse.json(updatedBrokerDue);
  } catch (error) {
    console.error('Error paying broker due:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في دفع العمولة' },
      { status: 500 }
    );
  }
}