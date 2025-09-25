'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, egp, getUnitDisplayName, unitById } from '@/utils';

export default function Partners() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('partners');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showPartnerPercentModal, setShowPartnerPercentModal] = useState(false);
  const [selectedPartnerLink, setSelectedPartnerLink] = useState<any>(null);
  const [newPercent, setNewPercent] = useState(0);

  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: ''
  });

  const [newGroup, setNewGroup] = useState({
    name: ''
  });

  const [groupPartners, setGroupPartners] = useState<any[]>([]);
  const [availablePartners, setAvailablePartners] = useState<any[]>([]);
  const [groupPercentSum, setGroupPercentSum] = useState(0);

  const filteredPartners = state.partners.filter(partner => {
    if (!searchQuery) return true;
    return partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (partner.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPartnerDebts = state.partnerDebts.filter(debt => {
    if (!searchQuery) return true;
    const paying = state.partners.find(p => p.id === debt.payingPartnerId)?.name || '';
    const owed = state.partners.find(p => p.id === debt.owedPartnerId)?.name || '';
    const unit = getUnitDisplayName(unitById(state, debt.unitId));
    const searchable = `${paying} ${owed} ${unit} ${debt.status}`.toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    if (selectedGroup) {
      const currentPartners = selectedGroup.partners || [];
      setGroupPartners(currentPartners);
      setAvailablePartners(state.partners.filter(p =>
        !currentPartners.some((cp: any) => cp.partnerId === p.id)
      ));
      setGroupPercentSum(currentPartners.reduce((sum: number, p: any) => sum + (p.percent || 0), 0));
    }
  }, [selectedGroup, state.partners]);

  const handleAddPartner = async () => {
    if (!newPartner.name.trim()) {
      alert('الرجاء إدخال اسم الشريك');
      return;
    }

    if (state.partners.some(p => p.name.toLowerCase() === newPartner.name.toLowerCase())) {
      alert('شريك بنفس الاسم موجود بالفعل');
      return;
    }

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });

      if (response.ok) {
        const partner = await response.json();
        dispatch({ type: 'SET_PARTNERS', payload: [...state.partners, partner] });
        alert('تم إضافة الشريك بنجاح');
        setShowAddPartnerForm(false);
        setNewPartner({ name: '', phone: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إضافة الشريك');
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      alert('حدث خطأ في إضافة الشريك');
    }
  };

  const handleAddGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('الرجاء إدخال اسم المجموعة');
      return;
    }

    if (state.partnerGroups.some(g => g.name.toLowerCase() === newGroup.name.toLowerCase())) {
      alert('مجموعة بنفس الاسم موجودة بالفعل');
      return;
    }

    try {
      const response = await fetch('/api/partner-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroup.name })
      });

      if (response.ok) {
        const group = await response.json();
        const updatedGroups = [...state.partnerGroups, group];
        dispatch({ type: 'SET_PARTNER_GROUPS', payload: updatedGroups });
        alert('تم إنشاء المجموعة بنجاح');
        setShowAddGroupForm(false);
        setNewGroup({ name: '' });
        setSelectedGroup(group);
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إنشاء المجموعة');
      }
    } catch (error) {
      console.error('Error creating partner group:', error);
      alert('حدث خطأ في إنشاء المجموعة');
    }
  };

  const handleAddPartnerToGroup = async (partnerId: string, percent: number) => {
    if (!selectedGroup || !partnerId || percent <= 0) {
      alert('البيانات غير صحيحة');
      return;
    }

    if (groupPercentSum + percent > 100) {
      alert(`لا يمكن إضافة هذه النسبة. الإجمالي الحالي ${groupPercentSum}%. إضافة ${percent}% سيجعل المجموع يتجاوز 100%`);
      return;
    }

    try {
      const response = await fetch('/api/partner-groups/add-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          partnerId,
          percent
        })
      });

      if (response.ok) {
        const result = await response.json();
        const updatedGroups = state.partnerGroups.map(g =>
          g.id === selectedGroup.id ? result.group : g
        );
        dispatch({ type: 'SET_PARTNER_GROUPS', payload: updatedGroups });
        setSelectedGroup(result.group);

        // إعادة تحميل قائمة الشركاء المتاحين
        const currentPartners = result.group.partners || [];
        setAvailablePartners(state.partners.filter(p =>
          !currentPartners.some((cp: any) => cp.partnerId === p.id)
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إضافة الشريك');
      }
    } catch (error) {
      console.error('Error adding partner to group:', error);
      alert('حدث خطأ في إضافة الشريك');
    }
  };

  const handleRemovePartnerFromGroup = async (partnerId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch('/api/partner-groups/remove-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          partnerId
        })
      });

      if (response.ok) {
        const result = await response.json();
        const updatedGroups = state.partnerGroups.map(g =>
          g.id === selectedGroup.id ? result.group : g
        );
        dispatch({ type: 'SET_PARTNER_GROUPS', payload: updatedGroups });
        setSelectedGroup(result.group);
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في حذف الشريك');
      }
    } catch (error) {
      console.error('Error removing partner from group:', error);
      alert('حدث خطأ في حذف الشريك');
    }
  };

  const handleUpdatePartnerPercent = async (linkId: string, newPercent: number) => {
    if (!newPercent || newPercent <= 0) {
      alert('الرجاء إدخال نسبة صحيحة');
      return;
    }

    const link = state.unitPartners.find(up => up.id === linkId);
    if (!link) return;

    const otherPartners = state.unitPartners.filter(up =>
      up.unitId === link.unitId && up.id !== linkId
    );
    const otherPartnersTotal = otherPartners.reduce((sum, p) => sum + p.percent, 0);

    if (otherPartnersTotal + newPercent > 100) {
      alert(`لا يمكن حفظ هذه النسبة. مجموع نسب الشركاء الآخرين هو ${otherPartnersTotal}%. إضافة ${newPercent}% سيجعل المجموع يتجاوز 100%`);
      return;
    }

    try {
      const response = await fetch('/api/unit-partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: linkId,
          percent: newPercent
        })
      });

      if (response.ok) {
        const updatedLink = await response.json();
        const updatedUnitPartners = state.unitPartners.map(up =>
          up.id === linkId ? updatedLink : up
        );
        dispatch({ type: 'SET_UNIT_PARTNERS', payload: updatedUnitPartners });
        alert('تم تحديث النسبة بنجاح');
        setShowPartnerPercentModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في تحديث النسبة');
      }
    } catch (error) {
      console.error('Error updating partner percent:', error);
      alert('حدث خطأ في تحديث النسبة');
    }
  };

  const handlePayPartnerDebt = async (debtId: string) => {
    if (!confirm('هل تؤكد سداد هذا الدين؟')) return;

    try {
      const response = await fetch(`/api/partner-debts/${debtId}/pay`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedDebt = await response.json();
        const updatedDebts = state.partnerDebts.map(d =>
          d.id === debtId ? updatedDebt : d
        );
        dispatch({ type: 'SET_PARTNER_DEBTS', payload: updatedDebts });
        alert('تم سداد الدين بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في سداد الدين');
      }
    } catch (error) {
      console.error('Error paying partner debt:', error);
      alert('حدث خطأ في سداد الدين');
    }
  };

  const getPartnerStats = (partnerId: string) => {
    const unitPartners = state.unitPartners.filter(up => up.partnerId === partnerId);
    const totalPercent = unitPartners.reduce((sum, up) => sum + up.percent, 0);

    const income = 0; // يحتاج لحساب من السندات
    const expenses = 0; // يحتاج لحساب من السندات

    return {
      unitsCount: unitPartners.length,
      totalPercent,
      income,
      expenses,
      netPosition: income - expenses
    };
  };

  const handleExportPartners = () => {
    const headers = ['الاسم', 'الهاتف', 'عدد الوحدات', 'إجمالي النسبة', 'الدخل', 'المصروفات', 'صافي الموقف'];
    const rows = state.partners.map(p => {
      const stats = getPartnerStats(p.id);
      return [
        p.name,
        p.phone || '',
        stats.unitsCount,
        `${stats.totalPercent}%`,
        stats.income,
        stats.expenses,
        stats.netPosition
      ];
    });
    console.log('Export partners CSV functionality to be implemented');
  };

  const handleExportPartnerDebts = () => {
    const headers = ['الشريك الدافع', 'الشريك المستحق', 'الوحدة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة'];
    const rows = state.partnerDebts.map(d => [
      state.partners.find(p => p.id === d.payingPartnerId)?.name || 'محذوف',
      state.partners.find(p => p.id === d.owedPartnerId)?.name || 'محذوف',
      getUnitDisplayName(unitById(state, d.unitId)),
      d.amount,
      d.dueDate,
      d.status
    ]);
    console.log('Export partner debts CSV functionality to be implemented');
  };

  return (
    <div className="partners">
      <div className="card">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'partners' ? 'active' : ''}`}
            onClick={() => setActiveTab('partners')}
          >
            الشركاء
          </button>
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            مجموعات الشركاء
          </button>
          <button
            className={`tab-btn ${activeTab === 'debts' ? 'active' : ''}`}
            onClick={() => setActiveTab('debts')}
          >
            ديون الشركاء
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'partners' && (
            <div className="partners-tab">
              <div className="grid grid-2">
                <div className="card">
                  <h3>إضافة شريك</h3>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="اسم الشريك"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="الهاتف"
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    />
                  </div>
                  <button className="btn" onClick={handleAddPartner}>
                    إضافة الشريك
                  </button>
                </div>

                <div className="card">
                  <h3>قائمة الشركاء</h3>
                  <div className="tools">
                    <input
                      className="input"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn secondary" onClick={handleExportPartners}>
                      تصدير CSV
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>الهاتف</th>
                          <th>عدد الوحدات</th>
                          <th>إجمالي النسبة</th>
                          <th>صافي الموقف</th>
                          <th>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPartners.map(partner => {
                          const stats = getPartnerStats(partner.id);
                          return (
                            <tr key={partner.id}>
                              <td>{partner.name}</td>
                              <td>{partner.phone || '—'}</td>
                              <td>{stats.unitsCount}</td>
                              <td>{stats.totalPercent}%</td>
                              <td style={{ color: stats.netPosition >= 0 ? 'var(--ok)' : 'var(--warn)' }}>
                                {egp(stats.netPosition)}
                              </td>
                              <td>
                                <button className="btn" onClick={() => console.log('عرض تفاصيل الشريك')}>
                                  تفاصيل
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredPartners.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              لا توجد شركاء
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

          {activeTab === 'groups' && (
            <div className="groups-tab">
              <div className="grid grid-2">
                <div className="card">
                  <h3>إضافة مجموعة شركاء</h3>
                  <div className="form-group">
                    <input
                      className="input"
                      placeholder="اسم المجموعة"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    />
                  </div>
                  <button className="btn" onClick={handleAddGroup}>
                    إنشاء المجموعة
                  </button>
                </div>

                <div className="card">
                  <h3>قائمة المجموعات</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>اسم المجموعة</th>
                          <th>عدد الشركاء</th>
                          <th>إجمالي النسبة</th>
                          <th>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.partnerGroups.map(group => {
                          const totalPercent = (group.partners || []).reduce((sum: number, p: any) => sum + (p.percent || 0), 0);
                          return (
                            <tr key={group.id}>
                              <td>{group.name}</td>
                              <td>{(group.partners || []).length}</td>
                              <td>
                                <span className={`badge ${totalPercent === 100 ? 'ok' : 'warn'}`}>
                                  {totalPercent}%
                                </span>
                              </td>
                              <td>
                                <button className="btn" onClick={() => setSelectedGroup(group)}>
                                  إدارة
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {state.partnerGroups.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              لا توجد مجموعات
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selectedGroup && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="header">
                    <h4>إدارة مجموعة: {selectedGroup.name}</h4>
                    <button className="btn secondary" onClick={() => setSelectedGroup(null)}>
                      إغلاق
                    </button>
                  </div>

                  <div className="grid grid-2">
                    <div className="card">
                      <h5>إضافة شريك للمجموعة</h5>
                      <div className="form-group">
                        <select className="select">
                          <option value="">اختر شريك...</option>
                          {availablePartners.map(partner => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          className="input"
                          placeholder="النسبة %"
                          min="0.1"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <button className="btn">إضافة</button>
                      <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
                        إجمالي النسبة الحالية: <strong>{groupPercentSum}%</strong>
                      </p>
                    </div>

                    <div className="card">
                      <h5>الشركاء في المجموعة</h5>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>الشريك</th>
                              <th>النسبة</th>
                              <th>إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupPartners.map((gp: any) => {
                              const partner = state.partners.find(p => p.id === gp.partnerId);
                              return (
                                <tr key={gp.partnerId}>
                                  <td>{partner?.name || 'محذوف'}</td>
                                  <td>{gp.percent}%</td>
                                  <td>
                                    <button className="btn secondary">حذف</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'debts' && (
            <div className="debts-tab">
              <h3>ديون الشركاء</h3>
              <div className="tools">
                <input
                  className="input"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn secondary" onClick={handleExportPartnerDebts}>
                  تصدير CSV
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>الشريك الدافع</th>
                      <th>الشريك المستحق</th>
                      <th>الوحدة</th>
                      <th>المبلغ</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartnerDebts.map(debt => {
                      const payingPartner = state.partners.find(p => p.id === debt.payingPartnerId);
                      const owedPartner = state.partners.find(p => p.id === debt.owedPartnerId);
                      const unit = unitById(state, debt.unitId);

                      return (
                        <tr key={debt.id}>
                          <td>{payingPartner?.name || 'محذوف'}</td>
                          <td>{owedPartner?.name || 'محذوف'}</td>
                          <td>{getUnitDisplayName(unit)}</td>
                          <td style={{ color: 'var(--warn)' }}>{egp(debt.amount)}</td>
                          <td>{debt.dueDate}</td>
                          <td>
                            <span className={`badge ${debt.status === 'مدفوع' ? 'ok' : 'warn'}`}>
                              {debt.status}
                            </span>
                          </td>
                          <td>
                            {debt.status !== 'مدفوع' && (
                              <button className="btn ok" onClick={() => handlePayPartnerDebt(debt.id)}>
                                سداد
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPartnerDebts.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                          لا توجد ديون
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

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
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
          margin-bottom: 16px;
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
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}