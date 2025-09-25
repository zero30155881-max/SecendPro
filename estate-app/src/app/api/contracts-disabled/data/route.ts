import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const unitId = searchParams.get('unitId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (unitId) where.unitId = unitId;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          unit: true,
          customer: true,
          installments: true,
          vouchers: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.contract.count({ where })
    ]);

    return NextResponse.json({
      contracts,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching contracts data:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات العقود' },
      { status: 500 }
    );
  }
}