// Base types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// Customer types
export interface Customer extends BaseEntity {
  name: string
  phone?: string
  nationalId?: string
  address?: string
  status: string
  notes?: string
}

export interface CreateCustomerData {
  name: string
  phone?: string
  nationalId?: string
  address?: string
  status?: string
  notes?: string
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string
}

// Unit types
export interface Unit extends BaseEntity {
  code: string
  name?: string
  unitType: string
  area?: string
  floor?: string
  building?: string
  totalPrice: number
  status: string
  notes?: string
}

export interface CreateUnitData {
  code: string
  name?: string
  unitType?: string
  area?: string
  floor?: string
  building?: string
  totalPrice?: number
  status?: string
  notes?: string
}

export interface UpdateUnitData extends Partial<CreateUnitData> {
  id: string
}

// Partner types
export interface Partner extends BaseEntity {
  name: string
  phone?: string
  notes?: string
}

export interface CreatePartnerData {
  name: string
  phone?: string
  notes?: string
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  id: string
}

// Contract types
export interface Contract extends BaseEntity {
  unitId: string
  customerId: string
  start: Date
  totalPrice: number
  discountAmount: number
  brokerName?: string
  brokerPercent: number
  brokerAmount: number
  commissionSafeId?: string
  downPaymentSafeId?: string
  maintenanceDeposit: number
  installmentType: string
  installmentCount: number
  extraAnnual: number
  annualPaymentValue: number
  downPayment: number
  paymentType: string
  unit?: Unit
  customer?: Customer
}

export interface CreateContractData {
  unitId: string
  customerId: string
  start: Date
  totalPrice: number
  discountAmount?: number
  brokerName?: string
  brokerPercent?: number
  brokerAmount?: number
  commissionSafeId?: string
  downPaymentSafeId?: string
  maintenanceDeposit?: number
  installmentType?: string
  installmentCount?: number
  extraAnnual?: number
  annualPaymentValue?: number
  downPayment?: number
  paymentType?: string
}

export interface UpdateContractData extends Partial<CreateContractData> {
  id: string
}

// Installment types
export interface Installment extends BaseEntity {
  unitId: string
  amount: number
  dueDate: Date
  status: string
  notes?: string
  unit?: Unit
}

export interface CreateInstallmentData {
  unitId: string
  amount: number
  dueDate: Date
  status?: string
  notes?: string
}

export interface UpdateInstallmentData extends Partial<CreateInstallmentData> {
  id: string
}

// Safe types
export interface Safe extends BaseEntity {
  name: string
  balance: number
}

export interface CreateSafeData {
  name: string
  balance?: number
}

export interface UpdateSafeData extends Partial<CreateSafeData> {
  id: string
}

// Voucher types
export interface Voucher extends BaseEntity {
  type: string
  date: Date
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linkedRef?: string
  safe?: Safe
  unit?: Unit
}

export interface CreateVoucherData {
  type: string
  date: Date
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linkedRef?: string
}

export interface UpdateVoucherData extends Partial<CreateVoucherData> {
  id: string
}

// Broker types
export interface Broker extends BaseEntity {
  name: string
  phone?: string
  notes?: string
}

export interface CreateBrokerData {
  name: string
  phone?: string
  notes?: string
}

export interface UpdateBrokerData extends Partial<CreateBrokerData> {
  id: string
}

// Partner Debt types
export interface PartnerDebt extends BaseEntity {
  partnerId: string
  amount: number
  dueDate: Date
  status: string
  notes?: string
  partner?: Partner
}

export interface CreatePartnerDebtData {
  partnerId: string
  amount: number
  dueDate: Date
  status?: string
  notes?: string
}

export interface UpdatePartnerDebtData extends Partial<CreatePartnerDebtData> {
  id: string
}

// Unit Partner types
export interface UnitPartner extends BaseEntity {
  unitId: string
  partnerId: string
  percentage: number
  unit?: Unit
  partner?: Partner
}

export interface CreateUnitPartnerData {
  unitId: string
  partnerId: string
  percentage: number
}

export interface UpdateUnitPartnerData extends Partial<CreateUnitPartnerData> {
  id: string
}

// Transfer types
export interface Transfer extends BaseEntity {
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string
  fromSafe?: Safe
  toSafe?: Safe
}

export interface CreateTransferData {
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string
}

export interface UpdateTransferData extends Partial<CreateTransferData> {
  id: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Dashboard types
export interface DashboardStats {
  totalCustomers: number
  totalUnits: number
  totalContracts: number
  totalRevenue: number
  pendingInstallments: number
  totalSafes: number
  safeBalance: number
  monthlyRevenue: number
  yearlyRevenue: number
}

// Filter types
export interface FilterOptions {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}