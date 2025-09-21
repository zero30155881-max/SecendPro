import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateCustomerData, UpdateCustomerData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  status: z.string().default('نشط'),
  notes: z.string().optional(),
})

const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1, 'معرف العميل مطلوب'),
})

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR national_id ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM customers ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get customers
    const result = await query(
      `SELECT 
        id, name, phone, national_id, address, status, notes, 
        created_at, updated_at
      FROM customers 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات العملاء' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    // Check for duplicate phone or national ID
    if (validatedData.phone) {
      const phoneCheck = await query(
        'SELECT id FROM customers WHERE phone = $1 AND deleted_at IS NULL',
        [validatedData.phone]
      )
      if (phoneCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    if (validatedData.nationalId) {
      const nationalIdCheck = await query(
        'SELECT id FROM customers WHERE national_id = $1 AND deleted_at IS NULL',
        [validatedData.nationalId]
      )
      if (nationalIdCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'رقم الهوية مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const result = await query(
      `INSERT INTO customers (name, phone, national_id, address, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone, national_id, address, status, notes, created_at, updated_at`,
      [
        validatedData.name,
        validatedData.phone || null,
        validatedData.nationalId || null,
        validatedData.address || null,
        validatedData.status,
        validatedData.notes || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء العميل بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء العميل' },
      { status: 500 }
    )
  }
}

// PUT /api/customers - Update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if customer exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingCustomer.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check for duplicate phone or national ID (excluding current customer)
    if (updateData.phone) {
      const phoneCheck = await query(
        'SELECT id FROM customers WHERE phone = $1 AND id != $2 AND deleted_at IS NULL',
        [updateData.phone, id]
      )
      if (phoneCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    if (updateData.nationalId) {
      const nationalIdCheck = await query(
        'SELECT id FROM customers WHERE national_id = $1 AND id != $2 AND deleted_at IS NULL',
        [updateData.nationalId, id]
      )
      if (nationalIdCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'رقم الهوية مستخدم بالفعل' },
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
        const dbField = key === 'nationalId' ? 'national_id' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE customers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, name, phone, national_id, address, status, notes, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث العميل بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث العميل' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers - Soft delete customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العميل مطلوب' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingCustomer.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check if customer has active contracts
    const contractsCheck = await query(
      'SELECT id FROM contracts WHERE customer_id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (contractsCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف العميل لوجود عقود مرتبطة به' },
        { status: 400 }
      )
    }

    // Soft delete customer
    await query(
      'UPDATE customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف العميل بنجاح'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف العميل' },
      { status: 500 }
    )
  }
}