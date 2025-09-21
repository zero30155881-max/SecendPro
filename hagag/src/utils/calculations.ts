import { Contract, Installment, Voucher, Safe, PartnerDebt } from '@/types'

// Contract calculations
export function calculateContractTotals(contract: Contract) {
  const {
    totalPrice,
    discountAmount = 0,
    brokerPercent = 0,
    maintenanceDeposit = 0,
    downPayment = 0,
    installmentCount = 0,
    extraAnnual = 0,
    annualPaymentValue = 0
  } = contract

  // Calculate broker amount
  const brokerAmount = (totalPrice * brokerPercent) / 100

  // Calculate net price after discount
  const netPrice = totalPrice - discountAmount

  // Calculate installment amount
  const installmentAmount = installmentCount > 0 ? netPrice / installmentCount : 0

  // Calculate total annual payments
  const totalAnnualPayments = extraAnnual * annualPaymentValue

  // Calculate remaining amount after down payment
  const remainingAmount = netPrice - downPayment

  return {
    totalPrice,
    discountAmount,
    netPrice,
    brokerAmount,
    brokerPercent,
    maintenanceDeposit,
    downPayment,
    installmentAmount,
    installmentCount,
    extraAnnual,
    annualPaymentValue,
    totalAnnualPayments,
    remainingAmount
  }
}

// Installment calculations
export function calculateInstallmentStatus(installment: Installment) {
  const now = new Date()
  const dueDate = new Date(installment.dueDate)
  const isOverdue = now > dueDate
  const daysOverdue = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return {
    isOverdue,
    daysOverdue,
    status: installment.status
  }
}

// Safe balance calculations
export function calculateSafeBalance(safe: Safe, vouchers: Voucher[]) {
  const totalReceipts = vouchers
    .filter(v => v.type === 'receipt' && v.safeId === safe.id)
    .reduce((sum, v) => sum + v.amount, 0)

  const totalPayments = vouchers
    .filter(v => v.type === 'payment' && v.safeId === safe.id)
    .reduce((sum, v) => sum + v.amount, 0)

  const calculatedBalance = totalReceipts - totalPayments

  return {
    totalReceipts,
    totalPayments,
    calculatedBalance,
    actualBalance: safe.balance,
    difference: calculatedBalance - safe.balance
  }
}

// Partner debt calculations
export function calculatePartnerDebts(partnerId: string, debts: PartnerDebt[]) {
  const partnerDebts = debts.filter(d => d.partnerId === partnerId)
  
  const totalDebt = partnerDebts.reduce((sum, debt) => sum + debt.amount, 0)
  const paidDebt = partnerDebts
    .filter(d => d.status === 'مدفوع')
    .reduce((sum, debt) => sum + debt.amount, 0)
  const pendingDebt = partnerDebts
    .filter(d => d.status === 'معلق')
    .reduce((sum, debt) => sum + debt.amount, 0)
  const overdueDebt = partnerDebts
    .filter(d => {
      const now = new Date()
      const dueDate = new Date(d.dueDate)
      return d.status === 'معلق' && now > dueDate
    })
    .reduce((sum, debt) => sum + debt.amount, 0)

  return {
    totalDebt,
    paidDebt,
    pendingDebt,
    overdueDebt,
    debtCount: partnerDebts.length
  }
}

// Revenue calculations
export function calculateRevenue(vouchers: Voucher[], dateFrom?: Date, dateTo?: Date) {
  let filteredVouchers = vouchers.filter(v => v.type === 'receipt')
  
  if (dateFrom) {
    filteredVouchers = filteredVouchers.filter(v => new Date(v.date) >= dateFrom)
  }
  
  if (dateTo) {
    filteredVouchers = filteredVouchers.filter(v => new Date(v.date) <= dateTo)
  }

  const totalRevenue = filteredVouchers.reduce((sum, v) => sum + v.amount, 0)
  
  // Group by month
  const monthlyRevenue = filteredVouchers.reduce((acc, v) => {
    const month = new Date(v.date).toISOString().slice(0, 7) // YYYY-MM
    acc[month] = (acc[month] || 0) + v.amount
    return acc
  }, {} as Record<string, number>)

  return {
    totalRevenue,
    monthlyRevenue,
    transactionCount: filteredVouchers.length
  }
}

// Unit calculations
export function calculateUnitStats(unit: any, contracts: Contract[], installments: Installment[]) {
  const unitContracts = contracts.filter(c => c.unitId === unit.id)
  const unitInstallments = installments.filter(i => i.unitId === unit.id)
  
  const totalContractValue = unitContracts.reduce((sum, c) => sum + c.totalPrice, 0)
  const paidInstallments = unitInstallments.filter(i => i.status === 'مدفوع')
  const pendingInstallments = unitInstallments.filter(i => i.status === 'معلق')
  
  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0)
  const totalPending = pendingInstallments.reduce((sum, i) => sum + i.amount, 0)
  
  const paymentProgress = totalContractValue > 0 ? (totalPaid / totalContractValue) * 100 : 0

  return {
    totalContractValue,
    totalPaid,
    totalPending,
    paymentProgress,
    contractCount: unitContracts.length,
    installmentCount: unitInstallments.length,
    paidInstallmentCount: paidInstallments.length,
    pendingInstallmentCount: pendingInstallments.length
  }
}

// Dashboard statistics
export function calculateDashboardStats(data: {
  customers: any[]
  units: any[]
  contracts: Contract[]
  installments: Installment[]
  vouchers: Voucher[]
  safes: Safe[]
  partnerDebts: PartnerDebt[]
}) {
  const { customers, units, contracts, installments, vouchers, safes, partnerDebts } = data

  // Basic counts
  const totalCustomers = customers.length
  const totalUnits = units.length
  const totalContracts = contracts.length
  const totalSafes = safes.length

  // Revenue calculations
  const revenue = calculateRevenue(vouchers)
  const monthlyRevenue = calculateRevenue(vouchers, 
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date()
  )
  const yearlyRevenue = calculateRevenue(vouchers,
    new Date(new Date().getFullYear(), 0, 1),
    new Date()
  )

  // Safe balance
  const safeBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)

  // Pending installments
  const pendingInstallments = installments.filter(i => i.status === 'معلق').length

  return {
    totalCustomers,
    totalUnits,
    totalContracts,
    totalRevenue: revenue.totalRevenue,
    pendingInstallments,
    totalSafes,
    safeBalance,
    monthlyRevenue: monthlyRevenue.totalRevenue,
    yearlyRevenue: yearlyRevenue.totalRevenue
  }
}

// Format currency
export function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

// Format number
export function formatNumber(number: number, decimals = 2) {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

// Calculate percentage
export function calculatePercentage(part: number, total: number) {
  if (total === 0) return 0
  return (part / total) * 100
}

// Date utilities
export function formatDate(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

// Validation helpers
export function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string) {
  const re = /^(\+966|0)?[5-9][0-9]{8}$/
  return re.test(phone.replace(/\s/g, ''))
}

export function validateNationalId(nationalId: string) {
  const re = /^[0-9]{10}$/
  return re.test(nationalId)
}