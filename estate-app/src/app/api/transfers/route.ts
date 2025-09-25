import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/transfers - جلب التحويلات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const safeId = searchParams.get('safeId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (safeId) {
      where.OR = [
        { fromSafeId: safeId },
        { toSafeId: safeId }
      ];
    }

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          fromSafe: true,
          toSafe: true
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.transfer.count({ where })
    ]);

    return NextResponse.json({
      transfers,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب التحويلات' },
      { status: 500 }
    );
  }
}

// POST /api/transfers - إنشاء تحويل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromSafeId, toSafeId, amount, date, notes } = body;

    if (!fromSafeId || !toSafeId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة أو المبلغ غير صحيح' },
        { status: 400 }
      );
    }

    if (fromSafeId === toSafeId) {
      return NextResponse.json(
        { error: 'لا يمكن التحويل إلى نفس الخزنة' },
        { status: 400 }
      );
    }

    // التحقق من وجود الخزن
    const [fromSafe, toSafe] = await Promise.all([
      prisma.safe.findUnique({ where: { id: fromSafeId } }),
      prisma.safe.findUnique({ where: { id: toSafeId } })
    ]);

    if (!fromSafe || !toSafe) {
      return NextResponse.json(
        { error: 'إحدى الخزن غير موجودة' },
        { status: 404 }
      );
    }

    if (fromSafe.balance < amount) {
      return NextResponse.json(
        { error: 'رصيد الخزنة المصدر غير كافي' },
        { status: 400 }
      );
    }

    // إنشاء التحويل
    const transfer = await prisma.transfer.create({
      data: {
        fromSafeId,
        toSafeId,
        amount: parseFloat(amount.toString()),
        date: new Date(date || new Date()),
        notes: notes || ''
      },
      include: {
        fromSafe: true,
        toSafe: true
      }
    });

    await logAction('إنشاء تحويل بين الخزن', {
      transferId: transfer.id,
      fromSafe: fromSafe.name,
      toSafe: toSafe.name,
      amount: transfer.amount
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء التحويل' },
      { status: 500 }
    );
  }
}