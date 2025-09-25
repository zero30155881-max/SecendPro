import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, partnerId, percent } = body;

    if (!groupId || !partnerId || !percent || percent <= 0 || percent > 100) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود المجموعة والشريك
    const [group, partner] = await Promise.all([
      prisma.partnerGroup.findUnique({ where: { id: groupId } }),
      prisma.partner.findUnique({ where: { id: partnerId } })
    ]);

    if (!group || !partner) {
      return NextResponse.json(
        { error: 'المجموعة أو الشريك غير موجود' },
        { status: 404 }
      );
    }

    // إضافة الشريك للمجموعة
    const updatedGroup = await prisma.partnerGroup.update({
      where: { id: groupId },
      data: {
        partners: {
          create: {
            partnerId,
            percent: parseFloat(percent.toString())
          }
        }
      },
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      }
    });

    await logAction('إضافة شريك لمجموعة', {
      groupId: updatedGroup.id,
      groupName: updatedGroup.name,
      partnerId: partner.id,
      partnerName: partner.name,
      percent
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('Error adding partner to group:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الشريك للمجموعة' },
      { status: 500 }
    );
  }
}