import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateVoucherData, UpdateVoucherData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createVoucherSchema = z.object({
  type: z.enum(['receipt', 'payment'], { required_error: 'نوع السند مطلوب' }),
  date: z.string().min(1, 'التاريخ مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  safeId: z.string().min(1, 'الخزنة مطلوبة'),
  description: z.string().min(1, 'الوصف مطلوب'),
  payer: z.string().optional(),
  beneficiary: z.string().optional(),
  linkedRef: z.string().optional(),
})

const updateVoucherSchema = createVoucherSchema.partial().extend({
  id: z.string().min(1, 'معرف السند مطلوب'),
})

// GET /api/vouchers - Get all vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const safeId = searchParams.get('safeId') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE v.deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (v.description ILIKE $${paramIndex} OR v.payer ILIKE $${paramIndex} OR v.beneficiary ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (type) {
      whereClause += ` AND v.type = $${paramIndex}`
      queryParams.push(type)
      paramIndex++
    }

    if (safeId) {
      whereClause += ` AND v.safe_id = $${paramIndex}`
      queryParams.push(safeId)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM vouchers v ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get vouchers with safe info
    const result = await query(
      `SELECT 
        v.id, v.type, v.date, v.amount, v.safe_id, v.description, 
        v.payer, v.beneficiary, v.linked_ref, v.created_at, v.updated_at,
        s.name as safe_name
      FROM vouchers v
      LEFT JOIN safes s ON v.safe_id = s.id
      ${whereClause}
      ORDER BY v.date DESC, v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        vouchers: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات السندات' },
      { status: 500 }
    )
  }
}

// POST /api/vouchers - Create new voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createVoucherSchema.parse(body)

    // Check if safe exists
    const safeCheck = await query(
      'SELECT id, balance FROM safes WHERE id = $1 AND deleted_at IS NULL',
      [validatedData.safeId]
    )
    
    if (safeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 400 }
      )
    }

    const currentBalance = parseFloat(safeCheck.rows[0].balance)

    // Create voucher
    const result = await query(
      `INSERT INTO vouchers (type, date, amount, safe_id, description, payer, beneficiary, linked_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, date, amount, safe_id, description, payer, beneficiary, linked_ref, created_at, updated_at`,
      [
        validatedData.type,
        validatedData.date,
        validatedData.amount,
        validatedData.safeId,
        validatedData.description,
        validatedData.payer || null,
        validatedData.beneficiary || null,
        validatedData.linkedRef || null,
      ]
    )

    // Update safe balance
    const newBalance = validatedData.type === 'receipt' 
      ? currentBalance + validatedData.amount
      : currentBalance - validatedData.amount

    await query(
      'UPDATE safes SET balance = $1, updated_at = NOW() WHERE id = $2',
      [newBalance, validatedData.safeId]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء السند بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء السند' },
      { status: 500 }
    )
  }
}

// PUT /api/vouchers - Update voucher
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateVoucherSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if voucher exists
    const existingVoucher = await query(
      'SELECT id, type, amount, safe_id FROM vouchers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingVoucher.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السند غير موجود' },
        { status: 404 }
      )
    }

    const oldVoucher = existingVoucher.rows[0]

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'safeId' ? 'safe_id' : 
                       key === 'linkedRef' ? 'linked_ref' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE vouchers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, type, date, amount, safe_id, description, payer, beneficiary, linked_ref, created_at, updated_at`,
      updateValues
    )

    // Update safe balance if amount or type changed
    if (updateData.amount !== undefined || updateData.type !== undefined) {
      const newType = updateData.type || oldVoucher.type
      const newAmount = updateData.amount || oldVoucher.amount
      const oldAmount = oldVoucher.amount
      const oldType = oldVoucher.type

      // Calculate balance change
      let balanceChange = 0
      if (oldType === 'receipt') balanceChange -= oldAmount
      else balanceChange += oldAmount
      
      if (newType === 'receipt') balanceChange += newAmount
      else balanceChange -= newAmount

      if (balanceChange !== 0) {
        await query(
          'UPDATE safes SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
          [balanceChange, updateData.safeId || oldVoucher.safe_id]
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث السند بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث السند' },
      { status: 500 }
    )
  }
}

// DELETE /api/vouchers - Soft delete voucher
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف السند مطلوب' },
        { status: 400 }
      )
    }

    // Check if voucher exists
    const existingVoucher = await query(
      'SELECT id, type, amount, safe_id FROM vouchers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingVoucher.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'السند غير موجود' },
        { status: 404 }
      )
    }

    const voucher = existingVoucher.rows[0]

    // Soft delete voucher
    await query(
      'UPDATE vouchers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    // Update safe balance
    const balanceChange = voucher.type === 'receipt' 
      ? -voucher.amount 
      : voucher.amount

    await query(
      'UPDATE safes SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
      [balanceChange, voucher.safe_id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف السند بنجاح'
    })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف السند' },
      { status: 500 }
    )
  }
}