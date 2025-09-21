import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CreateContractData, UpdateContractData } from '@/types'
import { z } from 'zod'

// Validation schemas
const createContractSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  customerId: z.string().min(1, 'العميل مطلوب'),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  totalPrice: z.number().min(0.01, 'السعر الإجمالي مطلوب'),
  discountAmount: z.number().min(0).default(0),
  brokerName: z.string().optional(),
  brokerPercent: z.number().min(0).max(100).default(0),
  brokerAmount: z.number().min(0).default(0),
  commissionSafeId: z.string().optional(),
  downPaymentSafeId: z.string().optional(),
  maintenanceDeposit: z.number().min(0).default(0),
  installmentType: z.string().default('شهري'),
  installmentCount: z.number().min(0).default(0),
  extraAnnual: z.number().min(0).default(0),
  annualPaymentValue: z.number().min(0).default(0),
  downPayment: z.number().min(0).default(0),
  paymentType: z.string().default('installment'),
})

const updateContractSchema = createContractSchema.partial().extend({
  id: z.string().min(1, 'معرف العقد مطلوب'),
})

// GET /api/contracts - Get all contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const unitId = searchParams.get('unitId') || ''
    const customerId = searchParams.get('customerId') || ''
    
    const offset = (page - 1) * limit

    // Build where clause
    let whereClause = 'WHERE c.deleted_at IS NULL'
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (c.broker_name ILIKE $${paramIndex} OR u.code ILIKE $${paramIndex} OR cu.name ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (unitId) {
      whereClause += ` AND c.unit_id = $${paramIndex}`
      queryParams.push(unitId)
      paramIndex++
    }

    if (customerId) {
      whereClause += ` AND c.customer_id = $${paramIndex}`
      queryParams.push(customerId)
      paramIndex++
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM contracts c ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get contracts with related data
    const result = await query(
      `SELECT 
        c.id, c.unit_id, c.customer_id, c.start_date, c.total_price, c.discount_amount,
        c.broker_name, c.broker_percent, c.broker_amount, c.commission_safe_id,
        c.down_payment_safe_id, c.maintenance_deposit, c.installment_type,
        c.installment_count, c.extra_annual, c.annual_payment_value, c.down_payment,
        c.payment_type, c.created_at, c.updated_at,
        u.code as unit_code, u.name as unit_name, u.unit_type, u.building,
        cu.name as customer_name, cu.phone as customer_phone
      FROM contracts c
      LEFT JOIN units u ON c.unit_id = u.id
      LEFT JOIN customers cu ON c.customer_id = cu.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        contracts: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات العقود' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createContractSchema.parse(body)

    // Check if unit exists and is available
    const unitCheck = await query(
      'SELECT id, status FROM units WHERE id = $1 AND deleted_at IS NULL',
      [validatedData.unitId]
    )
    
    if (unitCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    if (unitCheck.rows[0].status !== 'متاحة') {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير متاحة للعقد' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = $1 AND deleted_at IS NULL',
      [validatedData.customerId]
    )
    
    if (customerCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 400 }
      )
    }

    // Calculate broker amount if not provided
    let brokerAmount = validatedData.brokerAmount
    if (validatedData.brokerPercent > 0 && brokerAmount === 0) {
      brokerAmount = (validatedData.totalPrice * validatedData.brokerPercent) / 100
    }

    // Create contract
    const result = await query(
      `INSERT INTO contracts (
        unit_id, customer_id, start_date, total_price, discount_amount,
        broker_name, broker_percent, broker_amount, commission_safe_id,
        down_payment_safe_id, maintenance_deposit, installment_type,
        installment_count, extra_annual, annual_payment_value, down_payment,
        payment_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, unit_id, customer_id, start_date, total_price, discount_amount,
        broker_name, broker_percent, broker_amount, commission_safe_id,
        down_payment_safe_id, maintenance_deposit, installment_type,
        installment_count, extra_annual, annual_payment_value, down_payment,
        payment_type, created_at, updated_at`,
      [
        validatedData.unitId,
        validatedData.customerId,
        validatedData.startDate,
        validatedData.totalPrice,
        validatedData.discountAmount,
        validatedData.brokerName || null,
        validatedData.brokerPercent,
        brokerAmount,
        validatedData.commissionSafeId || null,
        validatedData.downPaymentSafeId || null,
        validatedData.maintenanceDeposit,
        validatedData.installmentType,
        validatedData.installmentCount,
        validatedData.extraAnnual,
        validatedData.annualPaymentValue,
        validatedData.downPayment,
        validatedData.paymentType,
      ]
    )

    // Update unit status to reserved
    await query(
      'UPDATE units SET status = $1, updated_at = NOW() WHERE id = $2',
      ['محجوزة', validatedData.unitId]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم إنشاء العقد بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء العقد' },
      { status: 500 }
    )
  }
}

// PUT /api/contracts - Update contract
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateContractSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if contract exists
    const existingContract = await query(
      'SELECT id FROM contracts WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingContract.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'startDate' ? 'start_date' :
                       key === 'totalPrice' ? 'total_price' :
                       key === 'discountAmount' ? 'discount_amount' :
                       key === 'brokerName' ? 'broker_name' :
                       key === 'brokerPercent' ? 'broker_percent' :
                       key === 'brokerAmount' ? 'broker_amount' :
                       key === 'commissionSafeId' ? 'commission_safe_id' :
                       key === 'downPaymentSafeId' ? 'down_payment_safe_id' :
                       key === 'maintenanceDeposit' ? 'maintenance_deposit' :
                       key === 'installmentType' ? 'installment_type' :
                       key === 'installmentCount' ? 'installment_count' :
                       key === 'extraAnnual' ? 'extra_annual' :
                       key === 'annualPaymentValue' ? 'annual_payment_value' :
                       key === 'downPayment' ? 'down_payment' :
                       key === 'paymentType' ? 'payment_type' : key
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex++
      }
    })

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE contracts 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, unit_id, customer_id, start_date, total_price, discount_amount,
         broker_name, broker_percent, broker_amount, commission_safe_id,
         down_payment_safe_id, maintenance_deposit, installment_type,
         installment_count, extra_annual, annual_payment_value, down_payment,
         payment_type, created_at, updated_at`,
      updateValues
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تم تحديث العقد بنجاح'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث العقد' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts - Soft delete contract
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العقد مطلوب' },
        { status: 400 }
      )
    }

    // Check if contract exists
    const existingContract = await query(
      'SELECT id, unit_id FROM contracts WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    
    if (existingContract.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // Check if contract has installments
    const installmentsCheck = await query(
      'SELECT id FROM installments WHERE unit_id = $1 AND deleted_at IS NULL',
      [existingContract.rows[0].unit_id]
    )
    
    if (installmentsCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف العقد لوجود أقساط مرتبطة به' },
        { status: 400 }
      )
    }

    // Soft delete contract
    await query(
      'UPDATE contracts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    // Update unit status back to available
    await query(
      'UPDATE units SET status = $1, updated_at = NOW() WHERE id = $2',
      ['متاحة', existingContract.rows[0].unit_id]
    )

    return NextResponse.json({
      success: true,
      message: 'تم حذف العقد بنجاح'
    })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في حذف العقد' },
      { status: 500 }
    )
  }
}