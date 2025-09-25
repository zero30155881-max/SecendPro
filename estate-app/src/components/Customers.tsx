'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/utils';

export default function Customers() {
  const { state, dispatch, saveState } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    status: 'نشط' as 'نشط' | 'موقوف',
    notes: ''
  });

  const filteredCustomers = state.customers.filter(customer => {
    if (!searchQuery) return true;
    const searchable = `${customer.name} ${customer.phone} ${customer.nationalId} ${customer.address} ${customer.status}`.toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف على الأقل.');
      return;
    }

    if (state.customers.some(c => c.name.toLowerCase() === newCustomer.name.toLowerCase())) {
      alert('عميل بنفس الاسم موجود بالفعل. الرجاء استخدام اسم مختلف.');
      return;
    }

    saveState();
    const customer = {
      id: uid('C'),
      ...newCustomer
    };
    dispatch({ type: 'ADD_CUSTOMER', payload: customer });
    setNewCustomer({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    });
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      saveState();
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    }
  };

  const handleExportCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'ملاحظات'];
    const rows = state.customers.map(c => [c.name, c.phone, c.nationalId, c.address, c.status, c.notes]);
    // This would need to be implemented in utils
    console.log('Export CSV functionality to be implemented');
  };

  return (
    <div className="customers">
      <div className="grid grid-2">
        <div className="card">
          <h3>إضافة عميل</h3>
          <div className="grid grid-2" style={{ gap: '10px' }}>
            <input
              className="input"
              placeholder="اسم العميل"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="الهاتف"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="الرقم القومي"
              value={newCustomer.nationalId}
              onChange={(e) => setNewCustomer({ ...newCustomer, nationalId: e.target.value })}
            />
            <input
              className="input"
              placeholder="العنوان"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            />
          </div>
          <select
            className="select"
            style={{ marginTop: '10px' }}
            value={newCustomer.status}
            onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as 'نشط' | 'موقوف' })}
          >
            <option value="نشط">نشط</option>
            <option value="موقوف">موقوف</option>
          </select>
          <textarea
            className="input"
            placeholder="ملاحظات"
            style={{ marginTop: '10px' }}
            rows={2}
            value={newCustomer.notes}
            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
          />
          <button className="btn" style={{ marginTop: '10px' }} onClick={handleAddCustomer}>
            حفظ
          </button>
        </div>

        <div className="card">
          <h3>العملاء</h3>
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
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>الرقم القومي</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.nationalId}</td>
                    <td>{customer.status}</td>
                    <td>
                      <button className="btn secondary" onClick={() => handleDeleteCustomer(customer.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
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