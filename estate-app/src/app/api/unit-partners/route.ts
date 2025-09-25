import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/unit-partners - جلب ربط الشركاء بالوحدات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const partnerId = searchParams.get('partnerId');

    const where: any = {};
    if (unitId) where.unitId = unitId;
    if (partnerId) where.partnerId = partnerId;

    const unitPartners = await prisma.unitPartner.findMany({
      where,
      include: {
        unit: true,
        partner: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(unitPartners);
  } catch (error) {
    console.error('Error fetching unit partners:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب ربط الشركاء بالوحدات' },
      { status: 500 }
    );
  }
}

// POST /api/unit-partners - إنشاء ربط شريك بوحدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, partnerId, percent } = body;

    if (!unitId || !partnerId || !percent || percent <= 0 || percent > 100) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود الوحدة والشريك
    const [unit, partner] = await Promise.all([
      prisma.unit.findUnique({ where: { id: unitId } }),
      prisma.partner.findUnique({ where: { id: partnerId } })
    ]);

    if (!unit || !partner) {
      return NextResponse.json(
        { error: 'الوحدة أو الشريك غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من مجموع النسب للوحدة
    const existingPartners = await prisma.unitPartner.findMany({
      where: { unitId },
      select: { percent: true }
    });

    const totalPercent = existingPartners.reduce((sum, p) => sum + p.percent, 0);
    if (totalPercent + percent > 100) {
      return NextResponse.json(
        { error: 'إجمالي النسب يتجاوز 100%' },
        { status: 400 }
      );
    }

    const unitPartner = await prisma.unitPartner.create({
      data: {
        unitId,
        partnerId,
        percent: parseFloat(percent.toString())
      },
      include: {
        unit: true,
        partner: true
      }
    });

    await logAction('ربط شريك بوحدة', {
      unitPartnerId: unitPartner.id,
      unitId: unitPartner.unitId,
      partnerId: unitPartner.partnerId,
      percent: unitPartner.percent
    });

    return NextResponse.json(unitPartner, { status: 201 });
  } catch (error) {
    console.error('Error creating unit partner:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في ربط الشريك بالوحدة' },
      { status: 500 }
    );
  }
}

// PUT /api/unit-partners - تحديث نسبة شريك في وحدة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, percent } = body;

    if (!id || !percent || percent <= 0 || percent > 100) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }

    const existingLink = await prisma.unitPartner.findUnique({
      where: { id },
      include: { unit: true, partner: true }
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'الربط غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من مجموع النسب للوحدة
    const otherPartners = await prisma.unitPartner.findMany({
      where: {
        unitId: existingLink.unitId,
        id: { not: id }
      },
      select: { percent: true }
    });

    const totalOtherPercent = otherPartners.reduce((sum, p) => sum + p.percent, 0);
    if (totalOtherPercent + percent > 100) {
      return NextResponse.json(
        { error: 'إجمالي النسب يتجاوز 100%' },
        { status: 400 }
      );
    }

    const updatedLink = await prisma.unitPartner.update({
      where: { id },
      data: { percent: parseFloat(percent.toString()) },
      include: { unit: true, partner: true }
    });

    await logAction('تحديث نسبة شريك في وحدة', {
      unitPartnerId: updatedLink.id,
      oldPercent: existingLink.percent,
      newPercent: updatedLink.percent
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating unit partner:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث نسبة الشريك' },
      { status: 500 }
    );
  }
}

// DELETE /api/unit-partners - حذف ربط شريك بوحدة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الربط مطلوب' },
        { status: 400 }
      );
    }

    const existingLink = await prisma.unitPartner.findUnique({
      where: { id },
      include: { unit: true, partner: true }
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'الربط غير موجود' },
        { status: 404 }
      );
    }

    await prisma.unitPartner.delete({
      where: { id }
    });

    await logAction('حذف ربط شريك بوحدة', {
      unitPartnerId: id,
      unitId: existingLink.unitId,
      partnerId: existingLink.partnerId
    });

    return NextResponse.json({ message: 'تم حذف الربط بنجاح' });
  } catch (error) {
    console.error('Error deleting unit partner:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الربط' },
      { status: 500 }
    );
  }
}