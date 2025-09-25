import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/brokers - جلب السماسرة
export async function GET(request: NextRequest) {
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(brokers);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب السماسرة' },
      { status: 500 }
    );
  }
}

// POST /api/brokers - إنشاء سمسار جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم السمسار مطلوب' },
        { status: 400 }
      );
    }

    const broker = await prisma.broker.create({
      data: {
        name: name.trim(),
        phone: phone || '',
        notes: notes || ''
      }
    });

    await logAction('إنشاء سمسار جديد', {
      brokerId: broker.id,
      name: broker.name
    });

    return NextResponse.json(broker, { status: 201 });
  } catch (error) {
    console.error('Error creating broker:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء السمسار' },
      { status: 500 }
    );
  }
}