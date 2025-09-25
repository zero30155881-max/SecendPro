import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings - الحصول على الإعدادات
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.setting.findFirst({
      where: { id: 'app_settings' }
    });

    if (!settings) {
      // إنشاء إعدادات افتراضية
      settings = await prisma.setting.create({
        data: {
          id: 'app_settings',
          theme: 'dark',
          font: 16,
          pass: null
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإعدادات' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - تحديث الإعدادات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, font, pass } = body;

    let settings = await prisma.setting.findFirst({
      where: { id: 'app_settings' }
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: 'app_settings',
          theme: theme || 'dark',
          font: font || 16,
          pass: pass || null
        }
      });
    } else {
      settings = await prisma.setting.update({
        where: { id: 'app_settings' },
        data: {
          theme: theme || settings.theme,
          font: font || settings.font,
          pass: pass !== undefined ? pass : settings.pass
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإعدادات' },
      { status: 500 }
    );
  }
}