import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateBrokerData, UpdateBrokerData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createBrokerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

const updateBrokerSchema = createBrokerSchema.partial().extend({
  id: z.string().min(1, 'معرف السمسار مطلوب'),
})

// GET /api/brokers - Get all brokers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM brokers ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get brokers with dues statistics
    const result = await query(
      `SELECT 
        b.id, b.name, b.phone, b.notes, b.created_at, b.updated_at,
        COALESCE(d.total_dues, 0) as total_dues,
        COALESCE(d.paid_dues, 0) as paid_dues,
        COALESCE(d.pending_dues, 0) as pending_dues,
        COALESCE(d.dues_count, 0) as dues_count
      FROM brokers b
      LEFT JOIN (
        SELECT 
          broker_id,
          SUM(amount) as total_dues,
          SUM(CASE WHEN status = 'مدفوع' THEN amount ELSE 0 END) as paid_dues,
          SUM(CASE WHEN status = 'معلق' THEN amount ELSE 0 END) as pending_dues,
          COUNT(*) as dues_count
        FROM broker_dues 
        WHERE deleted_at IS NULL
        GROUP BY broker_id
      ) d ON b.id = d.broker_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        brokers: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching brokers:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات السماسرة' },
      { status: 500 }
    )
  }
}

// POST /api/brokers - Create new broker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBrokerSchema.parse(body)

    // Check for duplicate name
    const nameCheck = await query(
      'SELECT id FROM brokers WHERE name = $1 AND deleted_at IS NULL',
      [validatedData.name]
    )
    if (nameCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create broker
    const result = await query(
      `INSERT INTO brokers (name, phone, notes)
       VALUES ($1, $2, $3)
       RETURNING id, name, phone, notes, created_at, updated_at`,
      [
        validatedData.name,
        validatedData.phone || null,
        validatedData.notes || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء السمسار بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating broker:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء السمسار' },
      { status: 500 }
    )
  }
}

// PUT /api/brokers - Update broker
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateBrokerSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if broker exists
    const existingBroker = await query(
      'SELECT id FROM brokers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingBroker.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current broker)
    if (updateData.name) {
      const nameCheck = await query(
        'SELECT id FROM brokers WHERE name = $1 AND id != $2 AND deleted_at IS NULL',
        [updateData.name, id]
      )
      if (nameCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'اسم السمسار مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE brokers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, phone, notes, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث السمسار بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating broker:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث السمسار' },
      { status: 500 }
    )
  }
}

// DELETE /api/brokers - Soft delete broker
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف السمسار مطلوب' },
        { status: 400 }
      )
    }

    // Check if broker exists
    const existingBroker = await query(
      'SELECT id FROM brokers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingBroker.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    // Check if broker has dues
    const duesCheck = await query(
      'SELECT id FROM broker_dues WHERE broker_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (duesCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف السمسار لوجود مستحقات مرتبطة به' },
        { status: 400 }
      )
    }

    // Soft delete broker
    await query(
      'UPDATE brokers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف السمسار بنجاح'
    })
  } catch (error) {
    console.error('Error deleting broker:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف السمسار' },
      { status: 500 }
    )
  }
}