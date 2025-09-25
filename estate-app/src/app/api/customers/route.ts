import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/customers - الحصول على جميع العملاء
export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب العملاء' },
      { status: 500 }
    );
  }
}

// POST /api/customers - إضافة عميل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, nationalId, address, status, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الاسم
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: name }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'عميل بنفس الاسم موجود بالفعل' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        nationalId,
        address,
        status,
        notes
      }
    });

    // تسجيل العملية في سجل التغييرات
    await logAction('إضافة عميل جديد', { id: customer.id, name: customer.name });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة العميل' },
      { status: 500 }
    );
  }
}