import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateSafeData, UpdateSafeData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createSafeSchema = z.object({
  name: z.string().min(1, 'اسم الخزنة مطلوب'),
  balance: z.number().min(0, 'الرصيد يجب أن يكون أكبر من أو يساوي صفر').default(0),
})

const updateSafeSchema = createSafeSchema.partial().extend({
  id: z.string().min(1, 'معرف الخزنة مطلوب'),
})

// GET /api/safes - Get all safes
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
      whereClause += ` AND name ILIKE $${paramIndex}`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM safes ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get safes with voucher statistics
    const result = await query(
      `SELECT 
        s.id, s.name, s.balance, s.created_at, s.updated_at,
        COALESCE(v.total_receipts, 0) as total_receipts,
        COALESCE(v.total_payments, 0) as total_payments,
        COALESCE(v.voucher_count, 0) as voucher_count
      FROM safes s
      LEFT JOIN (
        SELECT 
          safe_id,
          SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END) as total_receipts,
          SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as total_payments,
          COUNT(*) as voucher_count
        FROM vouchers 
        WHERE deleted_at IS NULL
        GROUP BY safe_id
      ) v ON s.id = v.safe_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        safes: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات الخزائن' },
      { status: 500 }
    )
  }
}

// POST /api/safes - Create new safe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSafeSchema.parse(body)

    // Check for duplicate name
    const nameCheck = await query(
      'SELECT id FROM safes WHERE name = $1 AND deleted_at IS NULL',
      [validatedData.name]
    )
    if (nameCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create safe
    const result = await query(
      `INSERT INTO safes (name, balance)
       VALUES ($1, $2)
       RETURNING id, name, balance, created_at, updated_at`,
      [validatedData.name, validatedData.balance]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء الخزنة بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating safe:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الخزنة' },
      { status: 500 }
    )
  }
}

// PUT /api/safes - Update safe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateSafeSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if safe exists
    const existingSafe = await query(
      'SELECT id FROM safes WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingSafe.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current safe)
    if (updateData.name) {
      const nameCheck = await query(
        'SELECT id FROM safes WHERE name = $1 AND id != $2 AND deleted_at IS NULL',
        [updateData.name, id]
      )
      if (nameCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
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
      `UPDATE safes 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, balance, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث الخزنة بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating safe:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الخزنة' },
      { status: 500 }
    )
  }
}

// DELETE /api/safes - Soft delete safe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الخزنة مطلوب' },
        { status: 400 }
      )
    }

    // Check if safe exists
    const existingSafe = await query(
      'SELECT id, balance FROM safes WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingSafe.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    const safeBalance = parseFloat(existingSafe.rows[0].balance)

    // Check if safe has balance
    if (safeBalance > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الخزنة لوجود رصيد بها' },
        { status: 400 }
      )
    }

    // Check if safe has vouchers
    const vouchersCheck = await query(
      'SELECT id FROM vouchers WHERE safe_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (vouchersCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الخزنة لوجود سندات مرتبطة بها' },
        { status: 400 }
      )
    }

    // Check if safe is used in transfers
    const transfersCheck = await query(
      'SELECT id FROM transfers WHERE (from_safe_id = $1 OR to_safe_id = $1) AND deleted_at IS NULL',
      [id]
    )
    
    if (transfersCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الخزنة لوجود تحويلات مرتبطة بها' },
        { status: 400 }
      )
    }

    // Soft delete safe
    await query(
      'UPDATE safes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخزنة بنجاح'
    })
  } catch (error) {
    console.error('Error deleting safe:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الخزنة' },
      { status: 500 }
    )
  }
}