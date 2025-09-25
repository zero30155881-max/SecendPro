import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/partners - جلب الشركاء
export async function GET(request: NextRequest) {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الشركاء' },
      { status: 500 }
    );
  }
}

// POST /api/partners - إنشاء شريك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم الشريك مطلوب' },
        { status: 400 }
      );
    }

    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        phone: phone || ''
      }
    });

    await logAction('إنشاء شريك جديد', {
      partnerId: partner.id,
      name: partner.name
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الشريك' },
      { status: 500 }
    );
  }
}