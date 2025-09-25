import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/safes - الحصول على جميع الخزن
export async function GET(request: NextRequest) {
  try {
    const safes = await prisma.safe.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(safes);
  } catch (error) {
    console.error('Error fetching safes:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الخزن' },
      { status: 500 }
    );
  }
}

// POST /api/safes - إضافة خزنة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, balance } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الاسم
    const existingSafe = await prisma.safe.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existingSafe) {
      return NextResponse.json(
        { error: 'خزنة بنفس الاسم موجودة بالفعل' },
        { status: 400 }
      );
    }

    const safe = await prisma.safe.create({
      data: {
        name,
        balance: balance || 0
      }
    });

    // تسجيل العملية
    await logAction('إضافة خزنة جديدة', { id: safe.id, name: safe.name, initialBalance: safe.balance });

    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    console.error('Error creating safe:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الخزنة' },
      { status: 500 }
    );
  }
}