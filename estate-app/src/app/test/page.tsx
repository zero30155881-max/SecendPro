'use client';

import { useApp } from '@/context/AppContext';

export default function TestPage() {
  const { state, dispatch } = useApp();

  const addTestCustomer = () => {
    dispatch({
      type: 'ADD_CUSTOMER',
      payload: {
        id: 'C-' + Date.now(),
        name: 'عميل تجريبي',
        phone: '01234567890',
        nationalId: '12345678901234',
        address: 'عنوان تجريبي',
        status: 'نشط',
        notes: 'ملاحظات تجريبية'
      }
    });
  };

  const addTestUnit = () => {
    dispatch({
      type: 'ADD_UNIT',
      payload: {
        id: 'U-' + Date.now(),
        code: 'A-1-101',
        name: 'شقة 101',
        status: 'متاحة',
        area: '120',
        floor: '1',
        building: 'A',
        notes: 'ملاحظات تجريبية',
        totalPrice: 1000000,
        unitType: 'سكني'
      }
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>صفحة الاختبار</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={addTestCustomer} style={{ marginRight: '10px' }}>
          إضافة عميل تجريبي
        </button>
        <button onClick={addTestUnit}>
          إضافة وحدة تجريبية
        </button>
      </div>

      <div>
        <h2>العملاء ({state.customers.length})</h2>
        {state.customers.map(customer => (
          <div key={customer.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <p>الاسم: {customer.name}</p>
            <p>الهاتف: {customer.phone}</p>
            <p>الحالة: {customer.status}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>الوحدات ({state.units.length})</h2>
        {state.units.map(unit => (
          <div key={unit.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <p>الاسم: {unit.name}</p>
            <p>الكود: {unit.code}</p>
            <p>الحالة: {unit.status}</p>
            <p>السعر: {unit.totalPrice}</p>
          </div>
        ))}
      </div>
    </div>
  );
}