import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/partners - الحصول على جميع الشركاء
export async function GET(request: NextRequest) {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        unitPartners: {
          include: {
            unit: true
          }
        }
      },
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

// POST /api/partners - إضافة شريك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الشريك مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الاسم
    const existingPartner = await prisma.partner.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: 'شريك بنفس الاسم موجود بالفعل' },
        { status: 400 }
      );
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        phone
      }
    });

    // تسجيل العملية
    await logAction('إضافة شريك جديد', { id: partner.id, name: partner.name });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الشريك' },
      { status: 500 }
    );
  }
}