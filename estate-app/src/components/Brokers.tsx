'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, egp, today } from '@/utils';

export default function Brokers() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBrokerDue, setSelectedBrokerDue] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    safeId: '',
    date: today()
  });

  const [newBroker, setNewBroker] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  const filteredBrokers = state.brokers.filter(broker => {
    if (!searchQuery) return true;
    return broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (broker.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const brokerDues = state.brokerDues.filter(due => due.status === 'due').sort((a, b) =>
    (a.dueDate || '').localeCompare(b.dueDate || '')
  );

  const handleAddBroker = async () => {
    if (!newBroker.name.trim()) {
      alert('الرجاء إدخال اسم السمسار');
      return;
    }

    if (state.brokers.some(b => b.name.toLowerCase() === newBroker.name.toLowerCase())) {
      alert('سمسار بنفس الاسم موجود بالفعل');
      return;
    }

    try {
      const response = await fetch('/api/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBroker)
      });

      if (response.ok) {
        const broker = await response.json();
        dispatch({ type: 'SET_BROKERS', payload: [...state.brokers, broker] });
        alert('تم إضافة السمسار بنجاح');
        setShowAddForm(false);
        setNewBroker({ name: '', phone: '', notes: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إضافة السمسار');
      }
    } catch (error) {
      console.error('Error adding broker:', error);
      alert('حدث خطأ في إضافة السمسار');
    }
  };

  const handlePayBrokerDue = async (brokerDue: any) => {
    setSelectedBrokerDue(brokerDue);
    setPaymentData({
      safeId: '',
      date: today()
    });
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedBrokerDue || !paymentData.safeId) {
      alert('الرجاء اختيار الخزنة');
      return;
    }

    try {
      const contract = state.contracts.find(c => c.id === selectedBrokerDue.contractId);
      if (!contract) {
        alert('لم يتم العثور على العقد المرتبط');
        return;
      }

      const safe = state.safes.find(s => s.id === paymentData.safeId);
      if (!safe) {
        alert('لم يتم العثور على الخزنة');
        return;
      }

      if (safe.balance < selectedBrokerDue.amount) {
        alert('رصيد الخزنة غير كافي');
        return;
      }

      // إنشاء سند الصرف
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          date: paymentData.date,
          amount: selectedBrokerDue.amount,
          safeId: paymentData.safeId,
          description: `صرف عمولة سمسار للعقد ${contract.code}`,
          beneficiary: selectedBrokerDue.brokerName,
          linkedRef: selectedBrokerDue.id
        })
      });

      if (response.ok) {
        // تحديث رصيد الخزنة
        const updatedSafes = state.safes.map(s =>
          s.id === paymentData.safeId ? { ...s, balance: s.balance - selectedBrokerDue.amount } : s
        );
        dispatch({ type: 'SET_SAFES', payload: updatedSafes });

        // تحديث حالة العمولة
        const updatedBrokerDues = state.brokerDues.map(d =>
          d.id === selectedBrokerDue.id ? {
            ...d,
            status: 'paid',
            paymentDate: new Date(paymentData.date),
            paidFromSafeId: paymentData.safeId
          } : d
        );
        dispatch({ type: 'SET_BROKER_DUES', payload: updatedBrokerDues });

        // تسجيل العملية
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'PAY_BROKER_DUE',
            description: `دفع عمولة سمسار بمبلغ ${egp(selectedBrokerDue.amount)}`,
            details: {
              brokerDueId: selectedBrokerDue.id,
              brokerName: selectedBrokerDue.brokerName,
              amount: selectedBrokerDue.amount,
              safeId: paymentData.safeId,
              contractId: contract.id
            }
          })
        });

        alert('تم دفع العمولة بنجاح');
        setShowPaymentModal(false);
        setSelectedBrokerDue(null);
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في دفع العمولة');
      }
    } catch (error) {
      console.error('Error paying broker due:', error);
      alert('حدث خطأ في دفع العمولة');
    }
  };

  const getBrokerStats = (brokerName: string) => {
    const dues = state.brokerDues.filter(d => d.brokerName === brokerName);
    const totalDue = dues.filter(d => d.status === 'due').reduce((sum, d) => sum + d.amount, 0);
    const totalPaid = dues.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);
    return { totalDue, totalPaid, total: totalDue + totalPaid };
  };

  const handleExportCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'الإجمالي المستحق', 'الإجمالي المدفوع', 'الإجمالي', 'الملاحظات'];
    const rows = state.brokers.map(b => {
      const stats = getBrokerStats(b.name);
      return [
        b.name,
        b.phone || '',
        stats.totalDue,
        stats.totalPaid,
        stats.total,
        b.notes || ''
      ];
    });
    console.log('Export CSV functionality to be implemented');
  };

  return (
    <div className="brokers">
      <div className="card">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            قائمة السماسرة
          </button>
          <button
            className={`tab-btn ${activeTab === 'dues' ? 'active' : ''}`}
            onClick={() => setActiveTab('dues')}
          >
            العمولات المستحقة
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'list' && (
            <div className="brokers-list">
              <div className="grid grid-2">
                <div className="card">
                  <h3>إضافة سمسار</h3>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="اسم السمسار"
                      value={newBroker.name}
                      onChange={(e) => setNewBroker({ ...newBroker, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="الهاتف"
                      value={newBroker.phone}
                      onChange={(e) => setNewBroker({ ...newBroker, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      className="input"
                      placeholder="ملاحظات"
                      rows={2}
                      value={newBroker.notes}
                      onChange={(e) => setNewBroker({ ...newBroker, notes: e.target.value })}
                    />
                  </div>
                  <button className="btn" onClick={handleAddBroker}>
                    إضافة السمسار
                  </button>
                </div>

                <div className="card">
                  <h3>قائمة السماسرة</h3>
                  <div className="tools">
                    <input
                      className="input"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn secondary" onClick={handleExportCSV}>
                      تصدير CSV
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>الهاتف</th>
                          <th>الإجمالي المستحق</th>
                          <th>الإجمالي المدفوع</th>
                          <th>الإجمالي</th>
                          <th>ملاحظات</th>
                          <th>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBrokers.map(broker => {
                          const stats = getBrokerStats(broker.name);
                          return (
                            <tr key={broker.id}>
                              <td>{broker.name}</td>
                              <td>{broker.phone || '—'}</td>
                              <td style={{ color: 'var(--warn)' }}>{egp(stats.totalDue)}</td>
                              <td style={{ color: 'var(--ok)' }}>{egp(stats.totalPaid)}</td>
                              <td><strong>{egp(stats.total)}</strong></td>
                              <td>{broker.notes || '—'}</td>
                              <td>
                                <button className="btn" onClick={() => console.log('عرض تفاصيل السمسار')}>
                                  تفاصيل
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredBrokers.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              لا توجد سماسرة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dues' && (
            <div className="broker-dues">
              <h3>العمولات المستحقة للدفع</h3>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>السمسار</th>
                      <th>العقد</th>
                      <th>الوحدة</th>
                      <th>المبلغ</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokerDues.map(due => {
                      const contract = state.contracts.find(c => c.id === due.contractId);
                      const unit = contract ? state.units.find(u => u.id === contract.unitId) : null;

                      return (
                        <tr key={due.id}>
                          <td>{due.brokerName}</td>
                          <td>{contract?.code || '—'}</td>
                          <td>{unit ? `${unit.code} - ${unit.name}` : '—'}</td>
                          <td style={{ color: 'var(--warn)', fontWeight: 'bold' }}>
                            {egp(due.amount)}
                          </td>
                          <td>{due.dueDate}</td>
                          <td>
                            <button
                              className="btn ok"
                              onClick={() => handlePayBrokerDue(due)}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              دفع الآن
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {brokerDues.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          لا توجد عمولات مستحقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && selectedBrokerDue && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد دفع عمولة سمسار</h3>

            <div className="payment-details">
              <p><strong>السمسار:</strong> {selectedBrokerDue.brokerName}</p>
              <p><strong>المبلغ:</strong> {egp(selectedBrokerDue.amount)}</p>
              <p><strong>العقد:</strong> {state.contracts.find(c => c.id === selectedBrokerDue.contractId)?.code || '—'}</p>
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
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
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

        .tab-content {
          padding-top: 20px;
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

        .payment-details {
          background: var(--bg);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .payment-details p {
          margin: 8px 0;
        }

        .grid {
          display: grid;
          gap: 20px;
        }

        .grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .tools {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
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

        .btn.ok {
          background-color: var(--success);
        }

        .btn.ok:hover {
          background-color: #15803d;
        }

        .input, .select {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background-color: var(--bg);
          color: var(--text);
          font-size: 14px;
          width: 100%;
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
      `}</style>
    </div>
  );
}