'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { calculateKpis, egp, getUnitDisplayName, unitById, custById } from '@/utils';

export default function Dashboard() {
  const { state } = useApp();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [kpis, setKpis] = useState(calculateKpis(state));

  useEffect(() => {
    setKpis(calculateKpis(state, { from: fromDate, to: toDate }));
  }, [state, fromDate, toDate]);

  const upcomingInstallments = state.installments
    .filter(i => i.status === 'غير مدفوع')
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 5);

  const recentTransactions = state.vouchers
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  const handleFilterApply = () => {
    setKpis(calculateKpis(state, { from: fromDate, to: toDate }));
  };

  return (
    <div className="dashboard">
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="tools" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label>من:</label>
            <input
              type="date"
              className="input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <label>إلى:</label>
            <input
              type="date"
              className="input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button className="btn" onClick={handleFilterApply}>تطبيق</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn secondary">طباعة PDF</button>
            <button className="btn secondary">تصدير Excel</button>
          </div>
        </div>
      </div>

      <div id="kpi-container-new" className="grid grid-4 panel">
        <div className="card">
          <h4>إجمالي المبيعات</h4>
          <div className="big">{egp(kpis.totalSales)}</div>
        </div>
        <div className="card">
          <h4>إجمالي المتحصلات</h4>
          <div className="big">{egp(kpis.totalReceipts)}</div>
        </div>
        <div className="card">
          <h4>إجمالي المديونية</h4>
          <div className="big">{egp(kpis.totalDebt)}</div>
        </div>
        <div className="card">
          <h4>إجمالي المصروفات</h4>
          <div className="big">{egp(kpis.totalExpenses)}</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: '16px', gap: '16px', alignItems: 'flex-start' }}>
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <h3>الأقساط القادمة والمتأخرة</h3>
          <div id="upcoming-installments-table">
            {upcomingInstallments.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>الوحدة</th>
                    <th>العميل</th>
                    <th>المبلغ</th>
                    <th>تاريخ الاستحقاق</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInstallments.map(i => {
                    const contract = state.contracts.find(c => c.unitId === i.unitId);
                    const customer = contract ? custById(state, contract.customerId) : null;
                    return (
                      <tr key={i.id}>
                        <td>{getUnitDisplayName(unitById(state, i.unitId) || {} as any)}</td>
                        <td>{customer?.name || '—'}</td>
                        <td>{egp(i.amount)}</td>
                        <td>{i.dueDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '12px' }}>سيتم عرض الأقساط هنا...</p>
            )}
          </div>
        </div>

        <div className="panel">
          <h3>حالة الوحدات</h3>
          <div className="chart-container" style={{ position: 'relative', height: '200px', width: '100%' }}>
            <canvas id="new-units-chart"></canvas>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <h3>أحدث الحركات المالية</h3>
        <div id="recent-transactions-table">
          {recentTransactions.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td style={{ color: t.type === 'receipt' ? 'var(--ok)' : 'var(--warn)', fontWeight: 'bold' }}>
                      {t.type === 'receipt' ? '+' : '-'} {egp(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '12px' }}>سيتم عرض أحدث الحركات هنا...</p>
          )}
        </div>
      </div>
    </div>
  );
}