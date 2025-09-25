import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/installments - الحصول على جميع الأقساط
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const status = searchParams.get('status');

    let where: any = {};

    if (unitId) {
      where.unitId = unitId;
    }

    if (status) {
      where.status = status;
    }

    const installments = await prisma.installment.findMany({
      where,
      include: {
        unit: true,
        contract: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(installments);
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الأقساط' },
      { status: 500 }
    );
  }
}

// POST /api/installments - إضافة قسط جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, contractId, type, amount, originalAmount, dueDate, status } = body;

    if (!unitId || !type || !amount) {
      return NextResponse.json(
        { error: 'جميع البيانات المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const installment = await prisma.installment.create({
      data: {
        unitId,
        contractId,
        type,
        amount,
        originalAmount: originalAmount || amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'غير مدفوع'
      }
    });

    // تسجيل العملية
    await logAction('إضافة قسط جديد', { id: installment.id, amount: installment.amount, dueDate: installment.dueDate });

    return NextResponse.json(installment, { status: 201 });
  } catch (error) {
    console.error('Error creating installment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة القسط' },
      { status: 500 }
    );
  }
}

// PUT /api/installments - تحديث قسط
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, amount, status, paymentDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف القسط مطلوب' },
        { status: 400 }
      );
    }

    const installment = await prisma.installment.findUnique({
      where: { id }
    });

    if (!installment) {
      return NextResponse.json(
        { error: 'القسط غير موجود' },
        { status: 404 }
      );
    }

    const updatedInstallment = await prisma.installment.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : installment.amount,
        status: status || installment.status,
        paymentDate: paymentDate ? new Date(paymentDate) : installment.paymentDate
      }
    });

    // تسجيل العملية
    await logAction('تحديث قسط', { id: updatedInstallment.id, status: updatedInstallment.status });

    return NextResponse.json(updatedInstallment);
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث القسط' },
      { status: 500 }
    );
  }
}