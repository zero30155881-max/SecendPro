export interface Customer {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  status: 'نشط' | 'موقوف';
  notes: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  status: 'متاحة' | 'مباعة' | 'محجوزة' | 'مرتجعة';
  area: string;
  floor: string;
  building: string;
  notes: string;
  totalPrice: number;
  unitType: string;
}

export interface Contract {
  id: string;
  code: string;
  unitId: string;
  customerId: string;
  totalPrice: number;
  downPayment: number;
  discountAmount: number;
  maintenanceDeposit: number;
  brokerName: string;
  brokerPercent: number;
  brokerAmount: number;
  commissionSafeId: string;
  type: 'installment' | 'cash';
  count: number;
  extraAnnual: number;
  annualPaymentValue: number;
  start: string;
}

export interface Installment {
  id: string;
  unitId: string;
  type: string;
  amount: number;
  originalAmount: number;
  dueDate: string;
  paymentDate: string | null;
  status: 'مدفوع' | 'مدفوع جزئياً' | 'غير مدفوع';
}

export interface Safe {
  id: string;
  name: string;
  balance: number;
}

export interface Voucher {
  id: string;
  type: 'receipt' | 'payment';
  date: string;
  amount: number;
  safeId: string;
  description: string;
  payer?: string;
  beneficiary?: string;
  linked_ref?: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
}

export interface UnitPartner {
  id: string;
  unitId: string;
  partnerId: string;
  percent: number;
}

export interface PartnerGroup {
  id: string;
  name: string;
  partners: Array<{
    partnerId: string;
    percent: number;
  }>;
}

export interface PartnerDebt {
  id: string;
  unitId: string;
  payingPartnerId: string;
  owedPartnerId: string;
  amount: number;
  dueDate: string;
  status: 'غير مدفوع' | 'مدفوع';
  paymentDate?: string;
}

export interface Broker {
  id: string;
  name: string;
  phone: string;
  notes: string;
}

export interface BrokerDue {
  id: string;
  contractId: string;
  brokerName: string;
  amount: number;
  dueDate: string;
  status: 'due' | 'paid';
  paymentDate?: string;
  paidFromSafeId?: string;
}

export interface Transfer {
  id: string;
  fromSafeId: string;
  toSafeId: string;
  amount: number;
  date: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  description: string;
  details: Record<string, any>;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  font: number;
  pass: string | null;
}

export interface AppState {
  customers: Customer[];
  units: Unit[];
  partners: Partner[];
  unitPartners: UnitPartner[];
  contracts: Contract[];
  installments: Installment[];
  payments: any[]; // Legacy
  partnerDebts: PartnerDebt[];
  safes: Safe[];
  transfers: Transfer[];
  auditLog: AuditLog[];
  vouchers: Voucher[];
  brokerDues: BrokerDue[];
  brokers: Broker[];
  partnerGroups: PartnerGroup[];
  settings: AppSettings;
  locked: boolean;
}

export interface NavigationRoute {
  id: string;
  title: string;
  render: (param?: any) => JSX.Element;
  tab: boolean;
}