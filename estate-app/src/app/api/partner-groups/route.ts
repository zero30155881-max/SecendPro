import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/partner-groups - جلب مجموعات الشركاء
export async function GET(request: NextRequest) {
  try {
    const partnerGroups = await prisma.partnerGroup.findMany({
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(partnerGroups);
  } catch (error) {
    console.error('Error fetching partner groups:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب مجموعات الشركاء' },
      { status: 500 }
    );
  }
}

// POST /api/partner-groups - إنشاء مجموعة شركاء جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم المجموعة مطلوب' },
        { status: 400 }
      );
    }

    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name: name.trim()
      },
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      }
    });

    await logAction('إنشاء مجموعة شركاء جديدة', {
      groupId: partnerGroup.id,
      name: partnerGroup.name
    });

    return NextResponse.json(partnerGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating partner group:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المجموعة' },
      { status: 500 }
    );
  }
}