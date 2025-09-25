import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/audit-logs - الحصول على سجل التغييرات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.auditLog.count();

    return NextResponse.json({
      logs: auditLogs,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل التغييرات' },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs - إضافة سجل تغيير جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, description, details } = body;

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        description,
        details: details ? JSON.stringify(details) : null
      },
      include: {
        user: true
      }
    });

    return NextResponse.json(auditLog, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة سجل التغيير' },
      { status: 500 }
    );
  }
}