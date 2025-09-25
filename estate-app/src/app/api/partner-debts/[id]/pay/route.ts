import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerDebtId = params.id;

    if (!partnerDebtId) {
      return NextResponse.json(
        { error: 'معرف الدين مطلوب' },
        { status: 400 }
      );
    }

    const partnerDebt = await prisma.partnerDebt.findUnique({
      where: { id: partnerDebtId },
      include: {
        payingPartner: true,
        owedPartner: true,
        unit: true
      }
    });

    if (!partnerDebt) {
      return NextResponse.json(
        { error: 'الدين غير موجود' },
        { status: 404 }
      );
    }

    if (partnerDebt.status !== 'غير مدفوع') {
      return NextResponse.json(
        { error: 'الدين مدفوع بالفعل' },
        { status: 400 }
      );
    }

    // تحديث حالة الدين
    const updatedPartnerDebt = await prisma.partnerDebt.update({
      where: { id: partnerDebtId },
      data: {
        status: 'مدفوع',
        paymentDate: new Date()
      },
      include: {
        payingPartner: true,
        owedPartner: true,
        unit: true
      }
    });

    await logAction('سداد دين شريك', {
      partnerDebtId: updatedPartnerDebt.id,
      payingPartner: updatedPartnerDebt.payingPartner.name,
      owedPartner: updatedPartnerDebt.owedPartner.name,
      amount: updatedPartnerDebt.amount,
      unitId: updatedPartnerDebt.unitId
    });

    return NextResponse.json(updatedPartnerDebt);
  } catch (error) {
    console.error('Error paying partner debt:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في سداد الدين' },
      { status: 500 }
    );
  }
}