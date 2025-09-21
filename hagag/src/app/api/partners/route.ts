import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreatePartnerData, UpdatePartnerData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createPartnerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

const updatePartnerSchema = createPartnerSchema.partial().extend({
  id: z.string().min(1, 'معرف الشريك مطلوب'),
})

// GET /api/partners - Get all partners
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
      `SELECT COUNT(*) FROM partners ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get partners with debt statistics
    const result = await query(
      `SELECT 
        p.id, p.name, p.phone, p.notes, p.created_at, p.updated_at,
        COALESCE(d.total_debt, 0) as total_debt,
        COALESCE(d.paid_debt, 0) as paid_debt,
        COALESCE(d.pending_debt, 0) as pending_debt,
        COALESCE(d.debt_count, 0) as debt_count
      FROM partners p
      LEFT JOIN (
        SELECT 
          partner_id,
          SUM(amount) as total_debt,
          SUM(CASE WHEN status = 'مدفوع' THEN amount ELSE 0 END) as paid_debt,
          SUM(CASE WHEN status = 'معلق' THEN amount ELSE 0 END) as pending_debt,
          COUNT(*) as debt_count
        FROM partner_debts 
        WHERE deleted_at IS NULL
        GROUP BY partner_id
      ) d ON p.id = d.partner_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        partners: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات الشركاء' },
      { status: 500 }
    )
  }
}

// POST /api/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPartnerSchema.parse(body)

    // Create partner
    const result = await query(
      `INSERT INTO partners (name, phone, notes)
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
      message: 'تم إنشاء الشريك بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating partner:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الشريك' },
      { status: 500 }
    )
  }
}

// PUT /api/partners - Update partner
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updatePartnerSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if partner exists
    const existingPartner = await query(
      'SELECT id FROM partners WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingPartner.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
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
      `UPDATE partners 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, phone, notes, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث الشريك بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الشريك' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners - Soft delete partner
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الشريك مطلوب' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const existingPartner = await query(
      'SELECT id FROM partners WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingPartner.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Check if partner has debts
    const debtsCheck = await query(
      'SELECT id FROM partner_debts WHERE partner_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (debtsCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الشريك لوجود ديون مرتبطة به' },
        { status: 400 }
      )
    }

    // Soft delete partner
    await query(
      'UPDATE partners SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف الشريك بنجاح'
    })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الشريك' },
      { status: 500 }
    )
  }
}