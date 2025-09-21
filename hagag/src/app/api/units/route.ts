import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateUnitData, UpdateUnitData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createUnitSchema = z.object({
  code: z.string().min(1, 'كود الوحدة مطلوب'),
  name: z.string().optional(),
  unitType: z.string().default('سكني'),
  area: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  totalPrice: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر').default(0),
  status: z.string().default('متاحة'),
  notes: z.string().optional(),
})

const updateUnitSchema = createUnitSchema.partial().extend({
  id: z.string().min(1, 'معرف الوحدة مطلوب'),
})

// GET /api/units - Get all units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const unitType = searchParams.get('unitType') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (code ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR building ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    if (unitType) {
      whereClause += ` AND unit_type = $${paramIndex}`
      queryParams.push(unitType)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM units ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get units
    const result = await query(
      `SELECT 
        id, code, name, unit_type, area, floor, building, 
        total_price, status, notes, created_at, updated_at
      FROM units 
      ${whereClause}
      ORDER BY code ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        units: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات الوحدات' },
      { status: 500 }
    )
  }
}

// POST /api/units - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createUnitSchema.parse(body)

    // Check for duplicate code
    const codeCheck = await query(
      'SELECT id FROM units WHERE code = $1 AND deleted_at IS NULL',
      [validatedData.code]
    )
    if (codeCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'كود الوحدة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create unit
    const result = await query(
      `INSERT INTO units (code, name, unit_type, area, floor, building, total_price, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, code, name, unit_type, area, floor, building, total_price, status, notes, created_at, updated_at`,
      [
        validatedData.code,
        validatedData.name || null,
        validatedData.unitType,
        validatedData.area || null,
        validatedData.floor || null,
        validatedData.building || null,
        validatedData.totalPrice,
        validatedData.status,
        validatedData.notes || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء الوحدة بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الوحدة' },
      { status: 500 }
    )
  }
}

// PUT /api/units - Update unit
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateUnitSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if unit exists
    const existingUnit = await query(
      'SELECT id FROM units WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingUnit.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check for duplicate code (excluding current unit)
    if (updateData.code) {
      const codeCheck = await query(
        'SELECT id FROM units WHERE code = $1 AND id != $2 AND deleted_at IS NULL',
        [updateData.code, id]
      )
      if (codeCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'كود الوحدة مستخدم بالفعل' },
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
        const dbField = key === 'unitType' ? 'unit_type' : 
                       key === 'totalPrice' ? 'total_price' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE units 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, code, name, unit_type, area, floor, building, total_price, status, notes, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث الوحدة بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الوحدة' },
      { status: 500 }
    )
  }
}

// DELETE /api/units - Soft delete unit
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الوحدة مطلوب' },
        { status: 400 }
      )
    }

    // Check if unit exists
    const existingUnit = await query(
      'SELECT id FROM units WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingUnit.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if unit has active contracts
    const contractsCheck = await query(
      'SELECT id FROM contracts WHERE unit_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (contractsCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الوحدة لوجود عقود مرتبطة بها' },
        { status: 400 }
      )
    }

    // Check if unit has installments
    const installmentsCheck = await query(
      'SELECT id FROM installments WHERE unit_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (installmentsCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الوحدة لوجود أقساط مرتبطة بها' },
        { status: 400 }
      )
    }

    // Soft delete unit
    await query(
      'UPDATE units SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف الوحدة بنجاح'
    })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الوحدة' },
      { status: 500 }
    )
  }
}