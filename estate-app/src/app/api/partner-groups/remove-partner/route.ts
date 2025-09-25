import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, partnerId } = body;

    if (!groupId || !partnerId) {
      return NextResponse.json(
        { error: 'معرف المجموعة والشريك مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من وجود المجموعة والشريك
    const group = await prisma.partnerGroup.findUnique({ where: { id: groupId } });

    if (!group) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    // حذف الشريك من المجموعة
    await prisma.partnerGroupPartner.deleteMany({
      where: {
        groupId,
        partnerId
      }
    });

    const updatedGroup = await prisma.partnerGroup.findUnique({
      where: { id: groupId },
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      }
    });

    await logAction('حذف شريك من مجموعة', {
      groupId: updatedGroup.id,
      groupName: updatedGroup.name,
      partnerId
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('Error removing partner from group:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الشريك من المجموعة' },
      { status: 500 }
    );
  }
}