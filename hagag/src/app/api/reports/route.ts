import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/reports - Get report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30'
    const type = searchParams.get('type') || 'overview'
    
    const days = parseInt(range)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get basic counts
    const [
      customersResult,
      unitsResult,
      contractsResult,
      safesResult,
      vouchersResult,
      installmentsResult,
      partnersResult,
      brokersResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM units WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM contracts WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM safes WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM vouchers WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM installments WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM partners WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM brokers WHERE deleted_at IS NULL')
    ])

    // Get financial data
    const [revenueResult, expensesResult] = await Promise.all([
      query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM vouchers 
        WHERE type = 'receipt' AND deleted_at IS NULL
        AND created_at >= $1
      `, [startDate]),
      query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM vouchers 
        WHERE type = 'payment' AND deleted_at IS NULL
        AND created_at >= $1
      `, [startDate])
    ])

    // Get monthly stats
    const monthlyStatsResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as expenses
      FROM vouchers 
      WHERE deleted_at IS NULL
      AND created_at >= $1
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `, [startDate])

    // Get unit type stats
    const unitTypeStatsResult = await query(`
      SELECT 
        unit_type as type,
        COUNT(*) as count,
        SUM(total_price) as total_value
      FROM units 
      WHERE deleted_at IS NULL
      GROUP BY unit_type
      ORDER BY count DESC
    `)

    // Get contract status stats
    const contractStatusStatsResult = await query(`
      SELECT 
        'نشط' as status,
        COUNT(*) as count,
        SUM(total_price) as total_value
      FROM contracts 
      WHERE deleted_at IS NULL
      UNION ALL
      SELECT 
        'منتهي' as status,
        COUNT(*) as count,
        SUM(total_price) as total_value
      FROM contracts 
      WHERE deleted_at IS NOT NULL
    `)

    // Get recent activity
    const recentActivityResult = await query(`
      SELECT 
        'voucher' as type,
        description,
        amount,
        created_at as date,
        id
      FROM vouchers 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `)

    const totalRevenue = parseFloat(revenueResult.rows[0].total)
    const totalExpenses = parseFloat(expensesResult.rows[0].total)
    const netProfit = totalRevenue - totalExpenses

    const monthlyStats = monthlyStatsResult.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      expenses: parseFloat(row.expenses),
      profit: parseFloat(row.revenue) - parseFloat(row.expenses)
    }))

    const unitTypeStats = unitTypeStatsResult.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      totalValue: parseFloat(row.total_value)
    }))

    const contractStatusStats = contractStatusStatsResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      totalValue: parseFloat(row.total_value)
    }))

    const recentActivity = recentActivityResult.rows.map(row => ({
      id: row.id,
      type: row.type === 'voucher' ? 'سند' : row.type,
      description: row.description,
      amount: parseFloat(row.amount),
      date: row.date
    }))

    const reportData = {
      totalCustomers: parseInt(customersResult.rows[0].count),
      totalUnits: parseInt(unitsResult.rows[0].count),
      totalContracts: parseInt(contractsResult.rows[0].count),
      totalSafes: parseInt(safesResult.rows[0].count),
      totalVouchers: parseInt(vouchersResult.rows[0].count),
      totalInstallments: parseInt(installmentsResult.rows[0].count),
      totalPartners: parseInt(partnersResult.rows[0].count),
      totalBrokers: parseInt(brokersResult.rows[0].count),
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyStats,
      unitTypeStats,
      contractStatusStats,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })
  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات التقرير' },
      { status: 500 }
    )
  }
}