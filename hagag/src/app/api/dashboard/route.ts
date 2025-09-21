import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get basic counts
    const [
      customersResult,
      unitsResult,
      contractsResult,
      safesResult,
      installmentsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM units WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM contracts WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_balance FROM safes WHERE deleted_at IS NULL'),
      query('SELECT COUNT(*) as count FROM installments WHERE status = \'معلق\' AND deleted_at IS NULL'),
    ])

    // Get revenue statistics
    const revenueResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END), 0) as total_receipts,
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as total_payments,
        COALESCE(SUM(CASE WHEN type = 'receipt' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_receipts,
        COALESCE(SUM(CASE WHEN type = 'receipt' AND DATE_TRUNC('year', date) = DATE_TRUNC('year', CURRENT_DATE) THEN amount ELSE 0 END), 0) as yearly_receipts
      FROM vouchers 
      WHERE deleted_at IS NULL
    `)

    // Get recent activities
    const activitiesResult = await query(`
      (SELECT 
        'contract' as type,
        'عقد جديد - ' || c.name as title,
        'وحدة ' || u.code || ' - مبلغ ' || co.total_price || ' ريال' as description,
        co.created_at,
        'success' as status
      FROM contracts co
      JOIN customers c ON co.customer_id = c.id
      JOIN units u ON co.unit_id = u.id
      WHERE co.deleted_at IS NULL
      ORDER BY co.created_at DESC
      LIMIT 3)
      
      UNION ALL
      
      (SELECT 
        'voucher' as type,
        CASE WHEN type = 'receipt' THEN 'إيصال جديد' ELSE 'سند دفع جديد' END as title,
        description || ' - ' || amount || ' ريال' as description,
        created_at,
        'success' as status
      FROM vouchers
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 3)
      
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Get upcoming installments
    const upcomingInstallmentsResult = await query(`
      SELECT 
        i.id,
        c.name as customer_name,
        u.code as unit_code,
        i.amount,
        i.due_date,
        i.status
      FROM installments i
      JOIN units u ON i.unit_id = u.id
      JOIN contracts co ON u.id = co.unit_id
      JOIN customers c ON co.customer_id = c.id
      WHERE i.deleted_at IS NULL 
        AND i.status = 'معلق'
        AND i.due_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY i.due_date ASC
      LIMIT 10
    `)

    // Get monthly revenue chart data (last 12 months)
    const monthlyRevenueResult = await query(`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COALESCE(SUM(CASE WHEN type = 'receipt' THEN amount ELSE 0 END), 0) as receipts,
        COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as payments
      FROM vouchers 
      WHERE deleted_at IS NULL 
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `)

    // Get unit status distribution
    const unitStatusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM units 
      WHERE deleted_at IS NULL
      GROUP BY status
    `)

    // Get contract status distribution
    const contractStatusResult = await query(`
      SELECT 
        'نشط' as status,
        COUNT(*) as count
      FROM contracts 
      WHERE deleted_at IS NULL
    `)

    // Build response
    const stats = {
      totalCustomers: parseInt(customersResult.rows[0].count),
      totalUnits: parseInt(unitsResult.rows[0].count),
      totalContracts: parseInt(contractsResult.rows[0].count),
      totalSafes: parseInt(safesResult.rows[0].count),
      safeBalance: parseFloat(safesResult.rows[0].total_balance || 0),
      pendingInstallments: parseInt(installmentsResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total_receipts || 0),
      totalExpenses: parseFloat(revenueResult.rows[0].total_payments || 0),
      monthlyRevenue: parseFloat(revenueResult.rows[0].monthly_receipts || 0),
      yearlyRevenue: parseFloat(revenueResult.rows[0].yearly_receipts || 0),
      netRevenue: parseFloat(revenueResult.rows[0].total_receipts || 0) - parseFloat(revenueResult.rows[0].total_payments || 0)
    }

    const recentActivities = activitiesResult.rows.map(row => ({
      id: Math.random().toString(36).substr(2, 9),
      type: row.type,
      title: row.title,
      description: row.description,
      time: getRelativeTime(new Date(row.created_at)),
      status: row.status
    }))

    const upcomingInstallments = upcomingInstallmentsResult.rows.map(row => ({
      id: row.id,
      customer: row.customer_name,
      unit: row.unit_code,
      amount: parseFloat(row.amount),
      dueDate: row.due_date,
      status: row.status
    }))

    const monthlyRevenue = monthlyRevenueResult.rows.map(row => ({
      month: new Date(row.month).toISOString().slice(0, 7), // YYYY-MM format
      receipts: parseFloat(row.receipts || 0),
      payments: parseFloat(row.payments || 0),
      net: parseFloat(row.receipts || 0) - parseFloat(row.payments || 0)
    }))

    const unitStatusDistribution = unitStatusResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentActivities,
        upcomingInstallments,
        monthlyRevenue,
        unitStatusDistribution
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب بيانات لوحة التحكم' },
      { status: 500 }
    )
  }
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'منذ لحظات'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
  } else {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`
  }
}