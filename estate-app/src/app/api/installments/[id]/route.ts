import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/installments/[id] - جلب قسط محدد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installmentId = params.id;

    if (!installmentId) {
      return NextResponse.json(
        { error: 'معرف القسط مطلوب' },
        { status: 400 }
      );
    }

    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        unit: true,
        contract: {
          include: {
            customer: true,
            unit: true
          }
        }
      }
    });

    if (!installment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(installment);
  } catch (error) {
    console.error('Error fetching installment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب القسط' },
      { status: 500 }
    );
  }
}

// PUT /api/installments/[id] - تحديث قسط محدد
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installmentId = params.id;
    const body = await request.json();
    const { amount, dueDate, status, paymentDate } = body;

    if (!installmentId) {
      return NextResponse.json(
        { error: 'معرف القسط مطلوب' },
        { status: 400 }
      );
    }

    const existingInstallment = await prisma.installment.findUnique({
      where: { id: installmentId }
    });

    if (!existingInstallment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount.toString());
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) updateData.status = status;
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: updateData,
      include: {
        unit: true,
        contract: {
          include: {
            customer: true,
            unit: true
          }
        }
      }
    });

    await logAction('تحديث قسط', {
      installmentId: updatedInstallment.id,
      updates: updateData
    });

    return NextResponse.json(updatedInstallment);
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث القسط' },
      { status: 500 }
    );
  }
}

// DELETE /api/installments/[id] - حذف قسط محدد
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installmentId = params.id;

    if (!installmentId) {
      return NextResponse.json(
        { error: 'معرف القسط مطلوب' },
        { status: 400 }
      );
    }

    const existingInstallment = await prisma.installment.findUnique({
      where: { id: installmentId }
    });

    if (!existingInstallment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      );
    }

    await prisma.installment.delete({
      where: { id: installmentId }
    });

    await logAction('حذف قسط', {
      installmentId,
      amount: existingInstallment.amount,
      contractId: existingInstallment.contractId
    });

    return NextResponse.json({ message: 'تم حذف القسط بنجاح' });
  } catch (error) {
    console.error('Error deleting installment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف القسط' },
      { status: 500 }
    );
  }
}