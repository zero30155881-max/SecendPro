'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, getUnitDisplayName, calcRemaining } from '@/utils';

export default function Units() {
  const { state, dispatch, saveState } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [newUnit, setNewUnit] = useState({
    name: '',
    floor: '',
    building: '',
    totalPrice: 0,
    area: '',
    unitType: 'سكني',
    notes: ''
  });

  const filteredUnits = state.units.filter(unit => {
    if (!searchQuery) return true;
    const searchable = `${unit.code} ${unit.name} ${unit.floor} ${unit.building} ${unit.status} ${unit.area} ${unit.unitType}`.toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  const handleAddUnit = () => {
    if (!newUnit.name || !newUnit.floor || !newUnit.building) {
      alert('الرجاء إدخال اسم الوحدة والدور والبرج.');
      return;
    }

    if (!newUnit.totalPrice) {
      alert('الرجاء إدخال سعر الوحدة.');
      return;
    }

    const san_b = newUnit.building.replace(/\s/g, '');
    const san_f = newUnit.floor.replace(/\s/g, '');
    const san_n = newUnit.name.replace(/\s/g, '');
    const code = `${san_b}-${san_f}-${san_n}`;

    if (state.units.some(u => u.code.toLowerCase() === code.toLowerCase())) {
      alert('هذه الوحدة (نفس الاسم والدور والبرج) موجودة بالفعل.');
      return;
    }

    saveState();
    const unit = {
      id: uid('U'),
      code,
      name: newUnit.name,
      status: 'متاحة' as const,
      area: newUnit.area,
      floor: newUnit.floor,
      building: newUnit.building,
      notes: newUnit.notes,
      totalPrice: newUnit.totalPrice,
      unitType: newUnit.unitType
    };
    dispatch({ type: 'ADD_UNIT', payload: unit });
    setNewUnit({
      name: '',
      floor: '',
      building: '',
      totalPrice: 0,
      area: '',
      unitType: 'سكني',
      notes: ''
    });
  };

  const handleDeleteUnit = (id: string) => {
    const unit = state.units.find(u => u.id === id);
    if (!unit) return;

    const isLinked = state.contracts.some(c => c.unitId === id);
    if (isLinked) {
      alert('لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد قائم. يجب حذف العقد أولاً.');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف الوحدة "${getUnitDisplayName(unit)}"؟`)) {
      saveState();
      dispatch({ type: 'DELETE_UNIT', payload: id });
    }
  };

  const handleExportCSV = () => {
    const headers = ['اسم الوحدة', 'الدور', 'البرج', 'نوع الوحدة', 'الشركاء', 'السعر', 'المتبقي', 'الحالة', 'ملاحظات'];
    const rows = state.units.map(u => {
      const partners = state.unitPartners
        .filter(up => up.unitId === u.id)
        .map(up => `${(state.partners.find(p => p.id === up.partnerId)?.name || 'محذوف')} (${up.percent}%)`)
        .join(' | ');
      return [
        u.name,
        u.floor,
        u.building,
        u.unitType,
        partners,
        u.totalPrice,
        calcRemaining(state, u),
        u.status,
        u.notes
      ];
    });
    console.log('Export CSV functionality to be implemented');
  };

  return (
    <div className="units">
      <div className="grid">
        <div className="card">
          <h3>إضافة وحدة</h3>
          <div className="grid grid-5">
            <input
              className="input"
              placeholder="اسم الوحدة"
              value={newUnit.name}
              onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="رقم الدور"
              value={newUnit.floor}
              onChange={(e) => setNewUnit({ ...newUnit, floor: e.target.value })}
            />
            <input
              className="input"
              placeholder="البرج/العمارة"
              value={newUnit.building}
              onChange={(e) => setNewUnit({ ...newUnit, building: e.target.value })}
            />
            <input
              className="input"
              placeholder="السعر الكلي"
              type="number"
              value={newUnit.totalPrice}
              onChange={(e) => setNewUnit({ ...newUnit, totalPrice: parseFloat(e.target.value) || 0 })}
            />
            <input
              className="input"
              placeholder="المساحة (م²)"
              value={newUnit.area}
              onChange={(e) => setNewUnit({ ...newUnit, area: e.target.value })}
            />
            <select
              className="select"
              value={newUnit.unitType}
              onChange={(e) => setNewUnit({ ...newUnit, unitType: e.target.value })}
            >
              <option>سكني</option>
              <option>تجاري</option>
              <option value="other">أخرى...</option>
            </select>
          </div>
          <textarea
            className="input"
            placeholder="ملاحظات"
            style={{ marginTop: '10px' }}
            rows={2}
            value={newUnit.notes}
            onChange={(e) => setNewUnit({ ...newUnit, notes: e.target.value })}
          />
          <button className="btn" style={{ marginTop: '10px' }} onClick={handleAddUnit}>
            حفظ
          </button>
        </div>

        <div className="card">
          <h3>قائمة الوحدات</h3>
          <div className="tools">
            <input
              className="input"
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn secondary" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn" onClick={() => console.log('Print functionality to be implemented')}>
              طباعة PDF
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>اسم الوحدة</th>
                  <th>الدور</th>
                  <th>البرج</th>
                  <th>نوع الوحدة</th>
                  <th>السعر</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(unit => {
                  const isSold = unit.status === 'مباعة';
                  const partners = state.unitPartners
                    .filter(up => up.unitId === unit.id)
                    .map(up => `${(state.partners.find(p => p.id === up.partnerId)?.name || 'محذوف')} (${up.percent}%)`)
                    .join(', ');

                  return (
                    <tr key={unit.id}>
                      <td>{unit.name}</td>
                      <td>{unit.floor}</td>
                      <td>{unit.building}</td>
                      <td>{unit.unitType}</td>
                      <td>{unit.totalPrice}</td>
                      <td>{calcRemaining(state, unit)}</td>
                      <td>{unit.status}</td>
                      <td>
                        <div className="tools" style={{ gap: '5px', flexWrap: 'nowrap' }}>
                          <button
                            className="btn"
                            disabled={isSold}
                            onClick={() => console.log('Navigate to unit details')}
                          >
                            إدارة
                          </button>
                          <button
                            className="btn gold"
                            disabled={isSold}
                            onClick={() => console.log('Navigate to unit edit')}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn secondary"
                            disabled={isSold}
                            onClick={() => handleDeleteUnit(unit.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUnits.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد بيانات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}