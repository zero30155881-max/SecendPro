import { AppState, Customer, Unit, Partner, Broker, Safe, Voucher, Contract, Installment, UnitPartner, PartnerGroup, PartnerDebt, BrokerDue, Transfer, AuditLog } from '@/types';
import { prisma } from '@/lib/prisma';

export function uid(prefix: string): string {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function egp(v: number): string {
  const fmt = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  v = Number(v || 0);
  return isFinite(v) ? fmt.format(v) + ' ج.م' : '';
}

export function parseNumber(v: string): number {
  v = String(v || '').replace(/[^\d.]/g, '');
  return Number(v || 0);
}

export function unitById(state: AppState, id: string): Unit | undefined {
  return state.units.find(u => u.id === id);
}

export function custById(state: AppState, id: string): Customer | undefined {
  return state.customers.find(c => c.id === id);
}

export function partnerById(state: AppState, id: string): Partner | undefined {
  return state.partners.find(p => p.id === id);
}

export function brokerById(state: AppState, id: string): Broker | undefined {
  return state.brokers.find(b => b.id === id);
}

export function unitCode(state: AppState, id: string): string {
  return (unitById(state, id) || {}).code || '—';
}

export function getUnitDisplayName(unit: Unit): string {
  if (!unit) return '—';
  const name = unit.code || '';
  const floor = unit.floor ? `رقم الدور (${unit.floor})` : '';
  const building = unit.building ? `رقم العمارة (${unit.building})` : '';
  return [name, floor, building].filter(Boolean).join(' ');
}

export function calculateKpis(state: AppState, filters?: { from?: string; to?: string }): any {
  let vouchers = state.vouchers;
  let installments = state.installments;
  let contracts = state.contracts;
  let units = state.units;

  if (filters?.from) {
    vouchers = vouchers.filter(v => v.date >= filters.from);
    installments = installments.filter(i => i.dueDate && i.dueDate >= filters.from);
    contracts = contracts.filter(c => c.start >= filters.from);
  }

  if (filters?.to) {
    vouchers = vouchers.filter(v => v.date <= filters.to);
    installments = installments.filter(i => i.dueDate && i.dueDate <= filters.to);
    contracts = contracts.filter(c => c.start <= filters.to);
  }

  const totalSales = contracts.reduce((sum, c) => sum + (c.totalPrice || 0), 0);
  const totalReceipts = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0);
  const totalExpenses = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0);

  const unitCounts = {
    available: units.filter(u => u.status === 'متاحة').length,
    sold: units.filter(u => u.status === 'مباعة').length,
    reserved: units.filter(u => u.status === 'محجوزة').length
  };

  const totalDebt = installments.filter(i => i.status === 'غير مدفوع').reduce((sum, i) => sum + i.amount, 0);

  return {
    totalSales,
    totalReceipts,
    totalExpenses,
    totalDebt,
    unitCounts
  };
}

export async function logAction(description: string, details: Record<string, any> = {}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM',
        description,
        details: JSON.stringify(details)
      }
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

export function generatePartnerLedger(state: AppState, partnerId: string): any {
  const partner = partnerById(state, partnerId);
  if (!partner) return { transactions: [], totalIncome: 0, totalExpense: 0, netPosition: 0 };

  const transactions = [];
  let totalIncome = 0;
  let totalExpense = 0;

  // Get all contracts where this partner has ownership
  const partnerUnits = state.unitPartners.filter(up => up.partnerId === partnerId);
  const unitIds = partnerUnits.map(up => up.unitId);

  state.contracts.filter(c => unitIds.includes(c.unitId)).forEach(contract => {
    const unit = unitById(state, contract.unitId);
    if (!unit) return;

    // Find payments related to this contract
    const installmentIds = new Set(state.installments.filter(i => i.unitId === contract.unitId).map(i => i.id));
    const relatedVouchers = state.vouchers.filter(v =>
      v.type === 'receipt' && (v.linked_ref === contract.id || installmentIds.has(v.linked_ref))
    );

    relatedVouchers.forEach(voucher => {
      const share = partnerUnits.find(up => up.unitId === contract.unitId)?.percent || 0;
      const partnerAmount = (voucher.amount * share) / 100;

      transactions.push({
        date: voucher.date,
        description: `دفعة للوحدة ${getUnitDisplayName(unit)}`,
        income: partnerAmount,
        expense: 0
      });

      totalIncome += partnerAmount;
    });

    // Check for broker commissions related to this contract
    const brokerDue = state.brokerDues.find(d => d.contractId === contract.id);
    if (brokerDue && brokerDue.status === 'paid') {
      const commissionVoucher = state.vouchers.find(v => v.linked_ref === brokerDue.id && v.description.includes('عمولة سمسار'));
      if (commissionVoucher) {
        const share = partnerUnits.find(up => up.unitId === contract.unitId)?.percent || 0;
        const partnerAmount = (commissionVoucher.amount * share) / 100;

        transactions.push({
          date: commissionVoucher.date,
          description: `عمولة سمسار للوحدة ${getUnitDisplayName(unit)}`,
          income: 0,
          expense: partnerAmount
        });

        totalExpense += partnerAmount;
      }
    }
  });

  return {
    transactions,
    totalIncome,
    totalExpense,
    netPosition: totalIncome - totalExpense
  };
}

export function calcRemaining(state: AppState, unit: Unit): number {
  const ct = state.contracts.find(c => c.unitId === unit.id);
  if (!ct) return 0;

  const totalOwed = (ct.totalPrice || 0) - (ct.discountAmount || 0);
  const installmentIds = new Set(state.installments.filter(i => i.unitId === unit.id).map(i => i.id));
  const totalPaid = state.vouchers
    .filter(v => v.type === 'receipt' && (v.linked_ref === ct.id || installmentIds.has(v.linked_ref)))
    .reduce((sum, v) => sum + v.amount, 0);

  const remaining = totalOwed - totalPaid;
  return Math.max(0, remaining);
}

export async function processPayment(
  unitId: string,
  amount: number,
  method: string,
  date: string,
  safeId: string,
  installmentId: string | null = null
): Promise<boolean> {
  try {
    if (!amount || !safeId) {
      console.error('بيانات الدفع غير مكتملة.');
      return false;
    }

    // التحقق من وجود الخزنة
    const safe = await prisma.safe.findUnique({
      where: { id: safeId }
    });

    if (!safe) {
      console.error('لم يتم العثور على الخزنة المحددة.');
      return false;
    }

    let remainingAmountToProcess = amount;

    // Get contract and customer info
    const contract = await prisma.contract.findFirst({
      where: { unitId },
      include: { customer: true }
    });

    // Create a receipt voucher for the payment
    const voucher = await prisma.voucher.create({
      data: {
        type: 'receipt',
        date: new Date(date),
        amount: amount,
        safeId: safeId,
        description: `سداد دفعة للوحدة ${unitId}`,
        payer: contract?.customer.name || 'غير محدد',
        linkedRef: installmentId || unitId
      }
    });

    // Update safe balance
    await prisma.safe.update({
      where: { id: safeId },
      data: { balance: { increment: amount } }
    });

    // تسجيل العملية
    await logAction('تسجيل سند قبض', { voucherId: voucher.id, unitId, amount, safeId });

    // If this payment is for an installment, apply it to the installments
    const installmentsToPay = await prisma.installment.findMany({
      where: {
        unitId: unitId,
        status: 'غير مدفوع',
        ...(installmentId ? { id: installmentId } : {})
      },
      orderBy: { dueDate: 'asc' }
    });

    if (installmentsToPay.length === 0 && installmentId) {
      console.warn(`Payment made for installment ${installmentId}, but no payable installments found for unit ${unitId}.`);
      return true;
    }

    for (const inst of installmentsToPay) {
      if (remainingAmountToProcess <= 0) break;

      const amountToPayOnThisInstallment = Math.min(remainingAmountToProcess, inst.amount.toNumber());

      await prisma.installment.update({
        where: { id: inst.id },
        data: {
          amount: inst.amount.toNumber() - amountToPayOnThisInstallment,
          ...(inst.amount.toNumber() - amountToPayOnThisInstallment <= 0.005 ? {
            status: 'مدفوع',
            paymentDate: new Date(date)
          } : {
            status: 'مدفوع جزئياً'
          })
        }
      });

      remainingAmountToProcess -= amountToPayOnThisInstallment;

      // تسجيل العملية
      await logAction('تطبيق دفعة على قسط', {
        installmentId: inst.id,
        paidAmount: amountToPayOnThisInstallment,
        remainingAmount: inst.amount.toNumber() - amountToPayOnThisInstallment
      });
    }

    if (remainingAmountToProcess > 0.005) {
      console.log(`Overpayment of ${egp(remainingAmountToProcess)} for unit ${unitId}.`);
    }

    return true; // Success
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
}

export function exportToCSV(headers: string[], rows: any[], filename: string): void {
  const csv = [headers.join(','), ...rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHTML(title: string, bodyHTML: string): void {
  const w = window.open('', '_blank');
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      @page { size: A4; margin: 12mm }
      body { font-family: system-ui, Segoe UI, Roboto; padding: 0; margin: 0; direction: rtl; color: #111 }
      .wrap { padding: 16px 18px }
      h1 { font-size: 20px; margin: 0 0 12px 0 }
      table { width: 100%; border-collapse: collapse; font-size: 13px }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; vertical-align: top }
      thead th { background: #f1f5f9 }
      footer { margin-top: 12px; font-size: 11px; color: #555 }
    </style>
  </head>
  <body>
    <div class="wrap">${bodyHTML}<footer>تمت الطباعة في ${new Date().toLocaleString('ar-EG')}</footer></div>
  </body>
  </html>`);

  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 250);
}