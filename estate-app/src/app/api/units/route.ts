import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/utils';

// GET /api/units - الحصول على جميع الوحدات
export async function GET(request: NextRequest) {
  try {
    const units = await prisma.unit.findMany({
      include: {
        unitPartners: {
          include: {
            partner: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الوحدات' },
      { status: 500 }
    );
  }
}

// POST /api/units - إضافة وحدة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, floor, building, totalPrice, area, unitType, notes, partnerGroupId } = body;

    if (!name || !floor || !building || !totalPrice) {
      return NextResponse.json(
        { error: 'جميع البيانات المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    // إنشاء كود الوحدة
    const san_b = building.replace(/\s/g, '');
    const san_f = floor.replace(/\s/g, '');
    const san_n = name.replace(/\s/g, '');
    const code = `${san_b}-${san_f}-${san_n}`;

    // التحقق من عدم تكرار الكود
    const existingUnit = await prisma.unit.findFirst({
      where: { code: code }
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: 'وحدة بنفس الكود موجودة بالفعل' },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.create({
      data: {
        code,
        name,
        floor,
        building,
        totalPrice,
        area,
        unitType,
        notes,
        status: 'متاحة'
      }
    });

    // إذا تم تحديد مجموعة شركاء، ربط الوحدة بها
    if (partnerGroupId) {
      const partnerGroup = await prisma.partnerGroup.findUnique({
        where: { id: partnerGroupId },
        include: { partners: { include: { partner: true } } }
      });

      if (partnerGroup) {
        // ربط الشركاء بالوحدة
        for (const pgp of partnerGroup.partners) {
          await prisma.unitPartner.create({
            data: {
              unitId: unit.id,
              partnerId: pgp.partnerId,
              percent: pgp.percent
            }
          });
        }
      }
    }

    // تسجيل العملية
    await logAction('إضافة وحدة جديدة', { id: unit.id, code: unit.code });

    // إرجاع الوحدة مع الشركاء
    const unitWithPartners = await prisma.unit.findUnique({
      where: { id: unit.id },
      include: {
        unitPartners: {
          include: {
            partner: true
          }
        }
      }
    });

    return NextResponse.json(unitWithPartners, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الوحدة' },
      { status: 500 }
    );
  }
}