import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateInstallmentData, UpdateInstallmentData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createInstallmentSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ مطلوب'),
  dueDate: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  status: z.string().default('معلق'),
  notes: z.string().optional(),
})

const updateInstallmentSchema = createInstallmentSchema.partial().extend({
  id: z.string().min(1, 'معرف القسط مطلوب'),
})

// GET /api/installments - Get all installments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const unitId = searchParams.get('unitId') || ''
    const overdue = searchParams.get('overdue') === 'true'
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE i.deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (u.code ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    if (unitId) {
      whereClause += ` AND i.unit_id = $${paramIndex}`
      queryParams.push(unitId)
      paramIndex++
    }

    if (overdue) {
      whereClause += ` AND i.due_date < CURRENT_DATE AND i.status = 'معلق'`
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM installments i ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get installments with related data
    const result = await query(
      `SELECT 
        i.id, i.unit_id, i.amount, i.due_date, i.status, i.notes,
        i.created_at, i.updated_at,
        u.code as unit_code, u.name as unit_name, u.building,
        c.name as customer_name, c.phone as customer_phone,
        co.total_price, co.discount_amount
      FROM installments i
      LEFT JOIN units u ON i.unit_id = u.id
      LEFT JOIN contracts co ON u.id = co.unit_id
      LEFT JOIN customers c ON co.customer_id = c.id
      ${whereClause}
      ORDER BY i.due_date ASC, i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        installments: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات الأقساط' },
      { status: 500 }
    )
  }
}

// POST /api/installments - Create new installment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createInstallmentSchema.parse(body)

    // Check if unit exists
    const unitCheck = await query(
      'SELECT id FROM units WHERE id = $1 AND deleted_at IS NULL',
      [validatedData.unitId]
    )
    
    if (unitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    // Create installment
    const result = await query(
      `INSERT INTO installments (unit_id, amount, due_date, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, unit_id, amount, due_date, status, notes, created_at, updated_at`,
      [
        validatedData.unitId,
        validatedData.amount,
        validatedData.dueDate,
        validatedData.status,
        validatedData.notes || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء القسط بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating installment:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء القسط' },
      { status: 500 }
    )
  }
}

// PUT /api/installments - Update installment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateInstallmentSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if installment exists
    const existingInstallment = await query(
      'SELECT id FROM installments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingInstallment.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'unitId' ? 'unit_id' :
                       key === 'dueDate' ? 'due_date' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE installments 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, unit_id, amount, due_date, status, notes, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث القسط بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating installment:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث القسط' },
      { status: 500 }
    )
  }
}

// DELETE /api/installments - Soft delete installment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف القسط مطلوب' },
        { status: 400 }
      )
    }

    // Check if installment exists
    const existingInstallment = await query(
      'SELECT id FROM installments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingInstallment.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Soft delete installment
    await query(
      'UPDATE installments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف القسط بنجاح'
    })
  } catch (error) {
    console.error('Error deleting installment:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف القسط' },
      { status: 500 }
    )
  }
}

// PATCH /api/installments - Mark installment as paid
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف القسط مطلوب' },
        { status: 400 }
      )
    }

    // Check if installment exists
    const existingInstallment = await query(
      'SELECT id, status FROM installments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingInstallment.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Update installment status
    const result = await query(
      `UPDATE installments 
       SET status = $1, notes = $2, updated_at = NOW()
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, unit_id, amount, due_date, status, notes, created_at, updated_at`,
      [status || 'مدفوع', notes || null, id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث حالة القسط بنجاح'
    })
  } catch (error) {
    console.error('Error updating installment status:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث حالة القسط' },
      { status: 500 }
    )
  }
}