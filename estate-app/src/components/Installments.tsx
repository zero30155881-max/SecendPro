'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getUnitDisplayName, unitById, custById, egp, today, processPayment } from '@/utils';

export default function Installments() {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    safeId: '',
    date: today()
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [currentList, setCurrentList] = useState<any[]>([]);

  const filteredInstallments = state.installments.filter(installment => {
    const matchesSearch = !searchQuery ||
      getUnitDisplayName(unitById(state, installment.unitId)).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (custById(state, state.contracts.find(c => c.unitId === installment.unitId)?.customerId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDateFrom = !dateFrom || (installment.dueDate && installment.dueDate >= dateFrom);
    const matchesDateTo = !dateTo || (installment.dueDate && installment.dueDate <= dateTo);
    const matchesStatus = statusFilter === 'all' || installment.status === statusFilter;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  // تجميع الأقساط حسب الوحدة
  const groupedInstallments = filteredInstallments.reduce((acc, installment) => {
    const unitId = installment.unitId;
    if (!acc[unitId]) {
      const contract = state.contracts.find(c => c.unitId === unitId);
      const customer = contract ? custById(state, contract.customerId) : null;
      const unit = unitById(state, unitId);

      acc[unitId] = {
        unit: unit,
        customer: customer,
        installments: [],
        totalRemaining: 0,
        overdueCount: 0,
        totalAmount: 0
      };
    }

    acc[unitId].installments.push(installment);
    acc[unitId].totalRemaining += installment.amount;
    acc[unitId].totalAmount += installment.originalAmount || installment.amount;

    if (installment.status === 'غير مدفوع' && installment.dueDate && new Date(installment.dueDate) < new Date()) {
      acc[unitId].overdueCount++;
    }

    return acc;
  }, {} as Record<string, any>);

  const toggleGroup = (unitId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handlePayment = async (installment: any) => {
    setSelectedInstallment(installment);
    setPaymentData({
      amount: installment.amount,
      safeId: '',
      date: today()
    });
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedInstallment || !paymentData.safeId || paymentData.amount <= 0) {
      alert('الرجاء ملء جميع البيانات');
      return;
    }

    try {
      const success = await processPayment(
        selectedInstallment.unitId,
        paymentData.amount,
        'قسط',
        paymentData.date,
        paymentData.safeId,
        selectedInstallment.id
      );

      if (success) {
        // تحديث القسط
        const response = await fetch(`/api/installments`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedInstallment.id,
            amount: Math.max(0, selectedInstallment.amount - paymentData.amount),
            status: selectedInstallment.amount - paymentData.amount <= 0.005 ? 'مدفوع' : 'مدفوع جزئياً',
            paymentDate: new Date(paymentData.date)
          })
        });

        if (response.ok) {
          const updatedInstallment = await response.json();

          // تحديث الحالة
          const updatedInstallments = state.installments.map(i =>
            i.id === selectedInstallment.id ? updatedInstallment : i
          );
          dispatch({ type: 'SET_INSTALLMENTS', payload: updatedInstallments });

          // تحديث رصيد الخزنة
          const safe = state.safes.find(s => s.id === paymentData.safeId);
          if (safe) {
            const updatedSafes = state.safes.map(s =>
              s.id === paymentData.safeId ? { ...s, balance: s.balance + paymentData.amount } : s
            );
            dispatch({ type: 'SET_SAFES', payload: updatedSafes });
          }

          // تسجيل العملية
          await fetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'PAY_INSTALLMENT',
              description: `سداد قسط بمبلغ ${egp(paymentData.amount)}`,
              details: {
                installmentId: selectedInstallment.id,
                amount: paymentData.amount,
                safeId: paymentData.safeId,
                date: paymentData.date
              }
            })
          });

          alert('تم تسجيل الدفعة بنجاح');
          setShowPaymentModal(false);
          setSelectedInstallment(null);
        } else {
          alert('حدث خطأ في تحديث القسط');
        }
      } else {
        alert('حدث خطأ في معالجة الدفعة');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('حدث خطأ في معالجة الدفعة');
    }
  };

  const handleReschedule = async (installment: any) => {
    const newAmount = prompt('قيمة القسط الجديدة:', installment.amount.toString());
    const newDate = prompt('تاريخ الاستحقاق الجديد (YYYY-MM-DD):', installment.dueDate || '');

    if (!newAmount || !newDate) return;

    const amount = parseFloat(newAmount);
    const date = new Date(newDate);

    if (isNaN(amount) || isNaN(date.getTime())) {
      alert('البيانات غير صحيحة');
      return;
    }

    try {
      const response = await fetch('/api/installments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: installment.id,
          amount: amount,
          dueDate: date.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        const updatedInstallment = await response.json();
        const updatedInstallments = state.installments.map(i =>
          i.id === installment.id ? updatedInstallment : i
        );
        dispatch({ type: 'SET_INSTALLMENTS', payload: updatedInstallments });

        alert('تم إعادة جدولة القسط بنجاح');
      } else {
        alert('حدث خطأ في إعادة جدولة القسط');
      }
    } catch (error) {
      console.error('Error rescheduling installment:', error);
      alert('حدث خطأ في إعادة جدولة القسط');
    }
  };

  const handleDelete = async (installment: any) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟')) return;

    try {
      const response = await fetch(`/api/installments/${installment.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedInstallments = state.installments.filter(i => i.id !== installment.id);
        dispatch({ type: 'SET_INSTALLMENTS', payload: updatedInstallments });
        alert('تم حذف القسط بنجاح');
      } else {
        alert('حدث خطأ في حذف القسط');
      }
    } catch (error) {
      console.error('Error deleting installment:', error);
      alert('حدث خطأ في حذف القسط');
    }
  };

  const handleExportCSV = () => {
    const headers = ['الوحدة', 'العميل', 'النوع', 'المبلغ الأصلي', 'المسدد', 'المتبقي', 'الاستحقاق', 'تاريخ السداد', 'الحالة'];
    const rows = currentList.map(i => [
      getUnitDisplayName(unitById(state, i.unitId)),
      (custById(state, state.contracts.find(c => c.unitId === i.unitId)?.customerId))?.name || '',
      i.type,
      i.originalAmount || i.amount,
      (i.originalAmount || i.amount) - i.amount,
      i.amount,
      i.dueDate || '',
      i.paymentDate || '',
      i.status
    ]);
    console.log('Export CSV functionality to be implemented');
  };

  const handlePrint = () => {
    const headers = ['الوحدة', 'العميل', 'النوع', 'المبلغ الأصلي', 'المسدد', 'المتبقي', 'الاستحقاق', 'الحالة'];
    const rows = currentList.map(i => `
      <tr>
        <td>${getUnitDisplayName(unitById(state, i.unitId))}</td>
        <td>${(custById(state, state.contracts.find(c => c.unitId === i.unitId)?.customerId))?.name || ''}</td>
        <td>${i.type || ''}</td>
        <td>${egp(i.originalAmount || i.amount)}</td>
        <td>${egp((i.originalAmount || i.amount) - i.amount)}</td>
        <td>${egp(i.amount)}</td>
        <td>${i.dueDate || ''}</td>
        <td>${i.status || ''}</td>
      </tr>`).join('');

    const printHTML = (title: string, bodyHTML: string) => {
      const w = window.open('', '_blank');
      if (w) {
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
        setTimeout(() => { w.focus(); w.print(); }, 250);
      }
    };

    printHTML('تقرير الأقساط', `<h1>تقرير الأقساط</h1><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
  };

  // تحديث القائمة الحالية للتصدير
  useEffect(() => {
    setCurrentList(filteredInstallments);
  }, [filteredInstallments]);

  return (
    <div className="installments">
      <div className="card">
        <h3>الأقساط</h3>

        <div className="tools" style={{ marginBottom: '16px' }}>
          <input
            className="input"
            placeholder="بحث بالوحدة/العميل/الحالة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="غير مدفوع">غير مدفوع</option>
            <option value="مدفوع جزئياً">مدفوع جزئياً</option>
            <option value="مدفوع">مدفوع</option>
          </select>
          <button className="btn" onClick={resetFilters}>إعادة تعيين</button>
          <button className="btn secondary" onClick={handleExportCSV}>تصدير CSV</button>
          <button className="btn secondary" onClick={handlePrint}>طباعة</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>العميل</th>
                <th>النوع</th>
                <th>المبلغ الأصلي</th>
                <th>المسدد</th>
                <th>المتبقي</th>
                <th>الاستحقاق</th>
                <th>تاريخ السداد</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedInstallments).map((group: any) => {
                const isExpanded = expandedGroups[group.unit.id];
                const summaryRow = (
                  <tr key={`summary-${group.unit.id}`} className="group-summary">
                    <td>
                      <span
                        className="expand-icon"
                        onClick={() => toggleGroup(group.unit.id)}
                        style={{ cursor: 'pointer', marginLeft: '8px' }}
                      >
                        {isExpanded ? '−' : '+'}
                      </span>
                      {group.unit.code || getUnitDisplayName(group.unit)}
                    </td>
                    <td>{group.customer?.name || '—'}</td>
                    <td colSpan={3} style={{ textAlign: 'center' }}>ملخص الوحدة</td>
                    <td><strong>{egp(group.totalRemaining)}</strong></td>
                    <td><strong>{egp(group.totalAmount)}</strong></td>
                    <td>
                      <span className={`badge ${group.overdueCount > 0 ? 'warn' : 'ok'}`}>
                        {group.overdueCount > 0 ? `${group.overdueCount} متأخر` : 'جاري'}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                );

                if (!isExpanded) return summaryRow;

                const detailRows = group.installments.map((installment: any) => {
                  const isPaid = installment.status === 'مدفوع';
                  const originalAmount = installment.originalAmount || installment.amount;
                  const paidAmount = originalAmount - installment.amount;

                  return (
                    <tr key={installment.id} className={`installment-detail ${isPaid ? 'paid' : ''}`}>
                      <td></td>
                      <td></td>
                      <td>{installment.type || ''}</td>
                      <td>{egp(originalAmount)}</td>
                      <td>{egp(paidAmount)}</td>
                      <td><strong>{egp(installment.amount)}</strong></td>
                      <td>{installment.dueDate || ''}</td>
                      <td>{installment.paymentDate || ''}</td>
                      <td>
                        <span className={`badge ${installment.status === 'مدفوع' ? 'ok' : installment.status === 'مدفوع جزئياً' ? 'warn' : 'info'}`}>
                          {installment.status}
                        </span>
                      </td>
                      <td>
                        <div className="tools" style={{ gap: '4px', flexWrap: 'nowrap' }}>
                          <button
                            className="btn ok"
                            onClick={() => handlePayment(installment)}
                            disabled={isPaid}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            دفع
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleReschedule(installment)}
                            disabled={isPaid}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            إعادة جدولة
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => handleDelete(installment)}
                            disabled={isPaid}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });

                return [summaryRow, ...detailRows];
              })}

              {Object.keys(groupedInstallments).length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    لا توجد أقساط
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedInstallment && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>تسجيل دفعة قسط</h3>

            <div className="form-group">
              <label>المبلغ المتبقي:</label>
              <input
                type="number"
                className="input"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>الخزنة:</label>
              <select
                className="select"
                value={paymentData.safeId}
                onChange={(e) => setPaymentData({ ...paymentData, safeId: e.target.value })}
              >
                <option value="">اختر الخزنة...</option>
                {state.safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({egp(safe.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>تاريخ الدفع:</label>
              <input
                type="date"
                className="input"
                value={paymentData.date}
                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              />
            </div>

            <div className="tools">
              <button className="btn secondary" onClick={() => setShowPaymentModal(false)}>
                إلغاء
              </button>
              <button className="btn ok" onClick={confirmPayment}>
                تأكيد الدفعة
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--panel);
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .group-summary {
          background: var(--primary-light);
          font-weight: bold;
        }

        .installment-detail {
          background: var(--bg);
        }

        .installment-detail.paid {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}