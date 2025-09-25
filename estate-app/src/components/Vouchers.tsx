'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { egp, getUnitDisplayName, unitById, custById } from '@/utils';

export default function Vouchers({ safeId }: { safeId?: string }) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [currentList, setCurrentList] = useState<any[]>([]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    beneficiary: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    safeId: ''
  });

  const filteredVouchers = state.vouchers.filter(voucher => {
    // فلترة حسب الخزنة إذا تم تحديدها
    if (safeId && voucher.safeId !== safeId) return false;

    // فلترة حسب النوع
    if (activeTab !== 'all' && voucher.type !== activeTab) return false;

    // فلترة حسب البحث
    if (searchQuery) {
      const searchable = `${voucher.description || ''} ${voucher.payer || ''} ${voucher.beneficiary || ''}`.toLowerCase();
      if (!searchable.includes(searchQuery.toLowerCase())) return false;
    }

    // فلترة حسب التاريخ
    if (dateFrom && voucher.date < dateFrom) return false;
    if (dateTo && voucher.date > dateTo) return false;

    return true;
  });

  const safeName = (id: string) => {
    const safe = state.safes.find(s => s.id === id);
    return safe ? safe.name : '—';
  };

  const getLinkedInfo = (voucher: any) => {
    if (voucher.linkedRef) {
      if (voucher.linkedRef.startsWith('CTR-')) {
        const contract = state.contracts.find(c => c.id === voucher.linkedRef);
        return contract ? `عقد ${contract.code}` : 'عقد غير موجود';
      }
      if (voucher.linkedRef.startsWith('I-')) {
        const installment = state.installments.find(i => i.id === voucher.linkedRef);
        if (installment) {
          const contract = state.contracts.find(c => c.unitId === installment.unitId);
          const unit = unitById(state, installment.unitId);
          return `قسط - ${unit ? getUnitDisplayName(unit) : 'وحدة غير موجودة'}`;
        }
      }
      if (voucher.linkedRef.startsWith('BD-')) {
        const brokerDue = state.brokerDues.find(bd => bd.id === voucher.linkedRef);
        return brokerDue ? `عمولة سمسار - ${brokerDue.brokerName}` : 'عمولة غير موجودة';
      }
      if (voucher.linkedRef === 'general_expense') {
        return 'مصروف عام';
      }
    }
    return '—';
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.beneficiary || !newExpense.amount || !newExpense.safeId) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    const safe = state.safes.find(s => s.id === newExpense.safeId);
    if (!safe) {
      alert('الخزنة المحددة غير موجودة');
      return;
    }

    if (safe.balance < newExpense.amount) {
      alert('رصيد الخزنة غير كافي');
      return;
    }

    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          date: newExpense.date,
          amount: newExpense.amount,
          safeId: newExpense.safeId,
          description: newExpense.description,
          beneficiary: newExpense.beneficiary,
          linkedRef: 'general_expense'
        })
      });

      if (response.ok) {
        const voucher = await response.json();

        // تحديث رصيد الخزنة
        const updatedSafes = state.safes.map(s =>
          s.id === newExpense.safeId ? { ...s, balance: s.balance - newExpense.amount } : s
        );
        dispatch({ type: 'SET_SAFES', payload: updatedSafes });

        // تسجيل العملية
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_EXPENSE_VOUCHER',
            description: `إضافة سند صرف بمبلغ ${egp(newExpense.amount)}`,
            details: voucher
          })
        });

        alert('تم إضافة السند بنجاح');
        setShowAddExpenseModal(false);
        setNewExpense({
          description: '',
          beneficiary: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          safeId: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إضافة السند');
      }
    } catch (error) {
      console.error('Error adding expense voucher:', error);
      alert('حدث خطأ في إضافة السند');
    }
  };

  const handleExportCSV = () => {
    const headers = ['التاريخ', 'النوع', 'المبلغ', 'البيان', 'الخزنة', 'الطرف الآخر', 'المرجع المرتبط'];
    const rows = currentList.map(v => [
      v.date,
      v.type === 'receipt' ? 'قبض' : 'صرف',
      v.amount,
      v.description,
      safeName(v.safeId),
      v.type === 'receipt' ? (v.payer || 'غير محدد') : (v.beneficiary || 'غير محدد'),
      getLinkedInfo(v)
    ]);
    console.log('Export vouchers CSV functionality to be implemented');
  };

  const handlePrint = () => {
    const headers = ['التاريخ', 'النوع', 'المبلغ', 'البيان', 'الخزنة', 'الطرف الآخر'];
    const rows = currentList.map(v => `
      <tr>
        <td>${v.date}</td>
        <td>${v.type === 'receipt' ? 'قبض' : 'صرف'}</td>
        <td>${egp(v.amount)}</td>
        <td>${v.description}</td>
        <td>${safeName(v.safeId)}</td>
        <td>${v.type === 'receipt' ? (v.payer || 'غير محدد') : (v.beneficiary || 'غير محدد')}</td>
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

    printHTML('تقرير السندات', `<h1>تقرير السندات</h1><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setActiveTab('all');
  };

  // تحديث القائمة الحالية للتصدير
  useEffect(() => {
    setCurrentList(filteredVouchers);
  }, [filteredVouchers]);

  const totalReceipts = currentList.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0);
  const totalPayments = currentList.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0);
  const netTotal = totalReceipts - totalPayments;

  return (
    <div className="vouchers">
      <div className="card">
        <div className="header">
          <h3>{safeId ? `سجل حركات خزنة: ${safeName(safeId)}` : 'سجل السندات'}</h3>
          {!safeId && (
            <button className="btn" onClick={() => setShowAddExpenseModal(true)}>
              إضافة سند صرف
            </button>
          )}
        </div>

        <div className="tabs" style={{ marginBottom: '16px' }}>
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            الجميع ({currentList.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'receipt' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipt')}
          >
            سندات قبض ({currentList.filter(v => v.type === 'receipt').length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            سندات صرف ({currentList.filter(v => v.type === 'payment').length})
          </button>
        </div>

        <div className="tools" style={{ marginBottom: '16px' }}>
          <input
            className="input"
            placeholder="بحث بالبيان أو الطرف الآخر..."
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
          <button className="btn" onClick={resetFilters}>إعادة تعيين</button>
          <button className="btn secondary" onClick={handleExportCSV}>تصدير CSV</button>
          <button className="btn secondary" onClick={handlePrint}>طباعة</button>
        </div>

        {/* ملخص مالي */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-value" style={{ color: 'var(--ok)' }}>
              {egp(totalReceipts)}
            </div>
            <div className="summary-label">إجمالي القبض</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ color: 'var(--warn)' }}>
              {egp(totalPayments)}
            </div>
            <div className="summary-label">إجمالي الصرف</div>
          </div>
          <div className="summary-card">
            <div className={`summary-value ${netTotal >= 0 ? 'ok' : 'warn'}`}>
              {netTotal >= 0 ? '+' : ''}{egp(netTotal)}
            </div>
            <div className="summary-label">صافي النتيجة</div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>البيان</th>
                <th>الخزنة</th>
                <th>الطرف الآخر</th>
                <th>المرجع المرتبط</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map(voucher => (
                <tr key={voucher.id}>
                  <td>{voucher.date}</td>
                  <td>
                    <span className={`badge ${voucher.type === 'receipt' ? 'ok' : 'warn'}`}>
                      {voucher.type === 'receipt' ? 'قبض' : 'صرف'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: voucher.type === 'receipt' ? 'var(--ok)' : 'var(--warn)', fontWeight: 'bold' }}>
                      {voucher.type === 'receipt' ? '+' : '-'}{egp(voucher.amount)}
                    </span>
                  </td>
                  <td>{voucher.description}</td>
                  <td>{safeName(voucher.safeId)}</td>
                  <td>
                    {voucher.type === 'receipt'
                      ? (voucher.payer || 'غير محدد')
                      : (voucher.beneficiary || 'غير محدد')
                    }
                  </td>
                  <td>{getLinkedInfo(voucher)}</td>
                </tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    لا توجد سندات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowAddExpenseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>إضافة سند صرف جديد</h3>

            <div className="form-group">
              <label>بيان المصروف:</label>
              <input
                type="text"
                className="input"
                placeholder="مثال: شراء مستلزمات مكتبية"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>المستفيد:</label>
              <input
                type="text"
                className="input"
                placeholder="اسم الجهة أو الشخص المستفيد"
                value={newExpense.beneficiary}
                onChange={(e) => setNewExpense({ ...newExpense, beneficiary: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>المبلغ:</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>التاريخ:</label>
              <input
                type="date"
                className="input"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>الخزنة:</label>
              <select
                className="select"
                value={newExpense.safeId}
                onChange={(e) => setNewExpense({ ...newExpense, safeId: e.target.value })}
              >
                <option value="">اختر الخزنة...</option>
                {state.safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({egp(safe.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="tools">
              <button className="btn secondary" onClick={() => setShowAddExpenseModal(false)}>
                إلغاء
              </button>
              <button className="btn" onClick={handleAddExpense}>
                إضافة السند
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 12px 24px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
        }

        .tab-btn:hover {
          color: var(--primary);
        }

        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .summary-value {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .summary-label {
          font-size: 12px;
          color: var(--muted);
        }

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
          padding: 24px;
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

        .tools {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .btn:hover {
          background-color: var(--primary-light);
        }

        .btn.secondary {
          background-color: var(--secondary);
        }

        .btn.secondary:hover {
          background-color: #475569;
        }

        .input, .select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background-color: var(--bg);
          color: var(--text);
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 16px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .table th,
        .table td {
          padding: 12px 8px;
          text-align: right;
          border-bottom: 1px solid var(--border);
        }

        .table th {
          background-color: var(--panel);
          font-weight: 600;
          color: var(--text);
        }

        .table tbody tr:hover {
          background-color: var(--primary-light);
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          border-radius: 4px;
        }

        .badge.ok {
          background-color: var(--success);
          color: white;
        }

        .badge.warn {
          background-color: var(--warning);
          color: var(--text);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}