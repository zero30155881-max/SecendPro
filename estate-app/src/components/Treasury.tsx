'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, egp, today } from '@/utils';

export default function Treasury() {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSafeModal, setShowAddSafeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedSafeForView, setSelectedSafeForView] = useState<any>(null);

  const [newSafe, setNewSafe] = useState({
    name: '',
    balance: 0
  });

  const [transferData, setTransferData] = useState({
    fromSafeId: '',
    toSafeId: '',
    amount: 0,
    date: today(),
    notes: ''
  });

  const filteredSafes = state.safes.filter(safe => {
    if (!searchQuery) return true;
    return safe.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddSafe = async () => {
    if (!newSafe.name.trim()) {
      alert('الرجاء إدخال اسم الخزنة');
      return;
    }

    if (state.safes.some(s => s.name.toLowerCase() === newSafe.name.toLowerCase())) {
      alert('خزنة بنفس الاسم موجودة بالفعل');
      return;
    }

    try {
      const response = await fetch('/api/safes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSafe)
      });

      if (response.ok) {
        const safe = await response.json();
        dispatch({ type: 'SET_SAFES', payload: [...state.safes, safe] });
        alert('تم إضافة الخزنة بنجاح');
        setShowAddSafeModal(false);
        setNewSafe({ name: '', balance: 0 });
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إضافة الخزنة');
      }
    } catch (error) {
      console.error('Error adding safe:', error);
      alert('حدث خطأ في إضافة الخزنة');
    }
  };

  const handleTransfer = async () => {
    if (!transferData.fromSafeId || !transferData.toSafeId || !transferData.amount) {
      alert('الرجاء ملء جميع البيانات');
      return;
    }

    if (transferData.fromSafeId === transferData.toSafeId) {
      alert('لا يمكن التحويل إلى نفس الخزنة');
      return;
    }

    if (transferData.amount <= 0) {
      alert('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

    const fromSafe = state.safes.find(s => s.id === transferData.fromSafeId);
    if (!fromSafe) {
      alert('الخزنة المصدر غير موجودة');
      return;
    }

    if (fromSafe.balance < transferData.amount) {
      alert('رصيد الخزنة المصدر غير كافي');
      return;
    }

    const toSafe = state.safes.find(s => s.id === transferData.toSafeId);
    if (!toSafe) {
      alert('الخزنة الهدف غير موجودة');
      return;
    }

    try {
      // إنشاء التحويل
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        const transfer = await response.json();

        // تحديث أرصدة الخزن
        const updatedSafes = state.safes.map(safe => {
          if (safe.id === transferData.fromSafeId) {
            return { ...safe, balance: safe.balance - transferData.amount };
          }
          if (safe.id === transferData.toSafeId) {
            return { ...safe, balance: safe.balance + transferData.amount };
          }
          return safe;
        });

        dispatch({ type: 'SET_SAFES', payload: updatedSafes });

        // تسجيل العملية
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_TRANSFER',
            description: `تحويل مبلغ ${egp(transferData.amount)} من ${fromSafe.name} إلى ${toSafe.name}`,
            details: transfer
          })
        });

        alert('تم تنفيذ التحويل بنجاح');
        setShowTransferModal(false);
        setTransferData({
          fromSafeId: '',
          toSafeId: '',
          amount: 0,
          date: today(),
          notes: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في تنفيذ التحويل');
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('حدث خطأ في تنفيذ التحويل');
    }
  };

  const getSafeTransactions = (safeId: string) => {
    const safe = state.safes.find(s => s.id === safeId);
    if (!safe) return { receipts: 0, payments: 0, transfersIn: 0, transfersOut: 0 };

    const vouchers = state.vouchers.filter(v => v.safeId === safeId);
    const transfers = state.transfers.filter(t =>
      t.fromSafeId === safeId || t.toSafeId === safeId
    );

    const receipts = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0);
    const payments = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0);
    const transfersIn = transfers.filter(t => t.toSafeId === safeId).reduce((sum, t) => sum + t.amount, 0);
    const transfersOut = transfers.filter(t => t.fromSafeId === safeId).reduce((sum, t) => sum + t.amount, 0);

    return { receipts, payments, transfersIn, transfersOut, balance: safe.balance };
  };

  const handleExportCSV = () => {
    const headers = ['اسم الخزنة', 'الرصيد الحالي', 'إجمالي القبض', 'إجمالي الصرف', 'صافي الحركة'];
    const rows = state.safes.map(safe => {
      const transactions = getSafeTransactions(safe.id);
      const netMovement = transactions.receipts + transactions.transfersIn - transactions.payments - transactions.transfersOut;
      return [
        safe.name,
        safe.balance,
        transactions.receipts,
        transactions.payments,
        netMovement
      ];
    });
    console.log('Export treasury CSV functionality to be implemented');
  };

  const handleViewSafeDetails = (safe: any) => {
    setSelectedSafeForView(safe);
  };

  return (
    <div className="treasury">
      <div className="card">
        <div className="header">
          <h3>إدارة الخزينة</h3>
          <div className="tools">
            <button className="btn" onClick={() => setShowAddSafeModal(true)}>
              إضافة خزنة جديدة
            </button>
            <button className="btn secondary" onClick={() => setShowTransferModal(true)}>
              تسجيل تحويل
            </button>
          </div>
        </div>

        <div className="tools" style={{ marginTop: '16px' }}>
          <input
            className="input"
            placeholder="بحث باسم الخزنة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn secondary" onClick={handleExportCSV}>
            تصدير CSV
          </button>
        </div>

        <div className="safes-grid">
          {filteredSafes.map(safe => {
            const transactions = getSafeTransactions(safe.id);
            const netMovement = transactions.receipts + transactions.transfersIn - transactions.payments - transactions.transfersOut;

            return (
              <div key={safe.id} className="safe-card">
                <div className="safe-header">
                  <h4>{safe.name}</h4>
                  <button className="btn" onClick={() => handleViewSafeDetails(safe)}>
                    عرض التفاصيل
                  </button>
                </div>

                <div className="safe-balance">
                  <div className="balance-amount">{egp(safe.balance)}</div>
                  <div className="balance-label">الرصيد الحالي</div>
                </div>

                <div className="safe-stats">
                  <div className="stat">
                    <div className="stat-value" style={{ color: 'var(--ok)' }}>
                      +{egp(transactions.receipts + transactions.transfersIn)}
                    </div>
                    <div className="stat-label">إجمالي الدخل</div>
                  </div>

                  <div className="stat">
                    <div className="stat-value" style={{ color: 'var(--warn)' }}>
                      -{egp(transactions.payments + transactions.transfersOut)}
                    </div>
                    <div className="stat-label">إجمالي الصرف</div>
                  </div>

                  <div className="stat">
                    <div className={`stat-value ${netMovement >= 0 ? 'ok' : 'warn'}`}>
                      {netMovement >= 0 ? '+' : ''}{egp(netMovement)}
                    </div>
                    <div className="stat-label">صافي الحركة</div>
                  </div>
                </div>

                <div className="safe-details">
                  <div className="detail-item">
                    <span className="detail-label">القبض:</span>
                    <span className="detail-value">{egp(transactions.receipts)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">الصرف:</span>
                    <span className="detail-value">{egp(transactions.payments)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">تحويلات واردة:</span>
                    <span className="detail-value">{egp(transactions.transfersIn)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">تحويلات صادرة:</span>
                    <span className="detail-value">{egp(transactions.transfersOut)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSafes.length === 0 && (
            <div className="no-safes">
              <p>لا توجد خزن</p>
              <button className="btn" onClick={() => setShowAddSafeModal(true)}>
                إضافة خزنة جديدة
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddSafeModal && (
        <div className="modal-overlay" onClick={() => setShowAddSafeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>إضافة خزنة جديدة</h3>

            <div className="form-group">
              <label>اسم الخزنة:</label>
              <input
                type="text"
                className="input"
                placeholder="مثال: الخزنة الرئيسية، حساب البنك"
                value={newSafe.name}
                onChange={(e) => setNewSafe({ ...newSafe, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>الرصيد الافتتاحي:</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={newSafe.balance}
                onChange={(e) => setNewSafe({ ...newSafe, balance: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="tools">
              <button className="btn secondary" onClick={() => setShowAddSafeModal(false)}>
                إلغاء
              </button>
              <button className="btn" onClick={handleAddSafe}>
                إضافة الخزنة
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>تسجيل تحويل بين الخزن</h3>

            <div className="form-group">
              <label>من خزنة:</label>
              <select
                className="select"
                value={transferData.fromSafeId}
                onChange={(e) => setTransferData({ ...transferData, fromSafeId: e.target.value })}
              >
                <option value="">اختر الخزنة المصدر...</option>
                {state.safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({egp(safe.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>إلى خزنة:</label>
              <select
                className="select"
                value={transferData.toSafeId}
                onChange={(e) => setTransferData({ ...transferData, toSafeId: e.target.value })}
              >
                <option value="">اختر الخزنة الهدف...</option>
                {state.safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({egp(safe.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>المبلغ:</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>التاريخ:</label>
              <input
                type="date"
                className="input"
                value={transferData.date}
                onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>ملاحظات:</label>
              <textarea
                className="input"
                rows={3}
                placeholder="ملاحظات التحويل (اختياري)"
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              />
            </div>

            <div className="tools">
              <button className="btn secondary" onClick={() => setShowTransferModal(false)}>
                إلغاء
              </button>
              <button className="btn" onClick={handleTransfer}>
                تنفيذ التحويل
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .safes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .safe-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: box-shadow 0.3s ease;
        }

        .safe-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .safe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .safe-header h4 {
          margin: 0;
          color: var(--text);
        }

        .safe-balance {
          text-align: center;
          margin-bottom: 16px;
        }

        .balance-amount {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .balance-label {
          font-size: 12px;
          color: var(--muted);
        }

        .safe-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat {
          text-align: center;
          padding: 8px;
          background: var(--bg);
          border-radius: 8px;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--muted);
        }

        .safe-details {
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .detail-label {
          font-size: 12px;
          color: var(--muted);
        }

        .detail-value {
          font-size: 12px;
          font-weight: 500;
        }

        .no-safes {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
        }

        .no-safes p {
          margin-bottom: 20px;
          font-size: 16px;
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