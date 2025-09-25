'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, today, getUnitDisplayName, unitById, custById, egp } from '@/utils';

export default function Contracts() {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContract, setNewContract] = useState({
    unitId: '',
    customerId: '',
    totalPrice: 0,
    downPayment: 0,
    discountAmount: 0,
    maintenanceDeposit: 0,
    brokerName: '',
    brokerPercent: 0,
    commissionSafeId: '',
    type: 'installment',
    count: 0,
    extraAnnual: 0,
    annualPaymentValue: 0,
    start: today()
  });

  const [installmentOptions, setInstallmentOptions] = useState({
    type: 'شهري',
    count: 0,
    extraAnnual: 0,
    annualBonusValue: 0
  });

  const filteredContracts = state.contracts.filter(contract => {
    if (!searchQuery) return true;
    const unit = unitById(state, contract.unitId);
    const customer = custById(state, contract.customerId);
    const searchable = `${contract.code} ${unit ? getUnitDisplayName(unit) : ''} ${customer?.name || ''} ${contract.brokerName || ''}`.toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  const updateTotalInstallments = () => {
    const count = parseInt(installmentOptions.count.toString()) || 0;
    const extra = parseInt(installmentOptions.extraAnnual.toString()) || 0;
    return count + extra;
  };

  const updateFormForUnit = () => {
    if (newContract.unitId) {
      const unit = unitById(state, newContract.unitId);
      if (unit) {
        setNewContract(prev => ({ ...prev, totalPrice: unit.totalPrice }));
      }
    }
  };

  const updateFormForPaymentType = () => {
    if (newContract.type === 'cash' && newContract.downPayment >= newContract.totalPrice) {
      setNewContract(prev => ({ ...prev, type: 'cash' }));
    }
  };

  const handleCreateContract = async () => {
    if (!newContract.unitId || !newContract.customerId || !newContract.totalPrice) {
      alert('الرجاء اختيار الوحدة والعميل وإدخال السعر');
      return;
    }

    const unit = unitById(state, newContract.unitId);
    if (!unit) {
      alert('الوحدة غير موجودة');
      return;
    }

    if (unit.status !== 'متاحة' && unit.status !== 'محجوزة') {
      alert('لا يمكن إنشاء عقد لهذه الوحدة');
      return;
    }

    try {
      // إنشاء العقد
      const contractData = {
        code: `CTR-${String(state.contracts.length + 1).padStart(5, '0')}`,
        unitId: newContract.unitId,
        customerId: newContract.customerId,
        totalPrice: newContract.totalPrice,
        downPayment: newContract.downPayment,
        discountAmount: newContract.discountAmount,
        maintenanceDeposit: newContract.maintenanceDeposit,
        brokerName: newContract.brokerName,
        brokerPercent: newContract.brokerPercent,
        brokerAmount: (newContract.totalPrice * newContract.brokerPercent) / 100,
        commissionSafeId: newContract.commissionSafeId,
        type: newContract.type,
        count: installmentOptions.count,
        extraAnnual: installmentOptions.extraAnnual,
        annualPaymentValue: installmentOptions.annualBonusValue,
        start: newContract.start
      };

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });

      if (response.ok) {
        const contract = await response.json();
        dispatch({ type: 'SET_CONTRACTS', payload: [...state.contracts, contract] });

        // إنشاء السندات والأقساط
        if (newContract.downPayment > 0) {
          await createDownPaymentVoucher(contract);
        }

        if (contractData.brokerAmount > 0) {
          await createBrokerDue(contract);
        }

        if (newContract.type === 'installment') {
          await createInstallments(contract);
        }

        // تحديث حالة الوحدة
        const updatedUnit = { ...unit, status: 'مباعة' };
        dispatch({ type: 'UPDATE_UNIT', payload: updatedUnit });

        // تسجيل العملية
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_CONTRACT',
            description: `إنشاء عقد جديد ${contract.code}`,
            details: contract
          })
        });

        alert('تم إنشاء العقد بنجاح');
        setShowAddForm(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إنشاء العقد');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('حدث خطأ في إنشاء العقد');
    }
  };

  const createDownPaymentVoucher = async (contract: any) => {
    try {
      await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'receipt',
          date: contract.start,
          amount: newContract.downPayment,
          safeId: newContract.commissionSafeId,
          description: `مقدم عقد للوحدة ${getUnitDisplayName(unitById(state, contract.unitId))}`,
          linkedRef: contract.id
        })
      });
    } catch (error) {
      console.error('Error creating down payment voucher:', error);
    }
  };

  const createBrokerDue = async (contract: any) => {
    try {
      await fetch('/api/broker-dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          brokerName: newContract.brokerName,
          amount: contract.brokerAmount,
          dueDate: contract.start
        })
      });
    } catch (error) {
      console.error('Error creating broker due:', error);
    }
  };

  const createInstallments = async (contract: any) => {
    try {
      const installmentBase = contract.totalPrice - (contract.maintenanceDeposit || 0);
      const totalAfterDown = installmentBase - contract.discountAmount - contract.downPayment;
      const totalAnnualPayments = installmentOptions.extraAnnual * installmentOptions.annualBonusValue;
      const amountForRegularInstallments = totalAfterDown - totalAnnualPayments;

      const months = { 'شهري': 1, 'ربع سنوي': 3, 'نصف سنوي': 6, 'سنوي': 12 }[installmentOptions.type] || 1;

      // إنشاء الأقساط العادية
      if (installmentOptions.count > 0) {
        const baseAmount = Math.floor((amountForRegularInstallments / installmentOptions.count) * 100) / 100;
        let accumulatedAmount = 0;

        for (let i = 0; i < installmentOptions.count; i++) {
          const dueDate = new Date(contract.start);
          dueDate.setMonth(dueDate.getMonth() + months * (i + 1));

          const amount = i === installmentOptions.count - 1
            ? Math.round((amountForRegularInstallments - accumulatedAmount) * 100) / 100
            : baseAmount;

          await fetch('/api/installments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              unitId: contract.unitId,
              contractId: contract.id,
              type: installmentOptions.type,
              amount: amount,
              originalAmount: amount,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'غير مدفوع'
            })
          });

          accumulatedAmount += amount;
        }
      }

      // إنشاء الدفعات السنوية
      for (let j = 0; j < installmentOptions.extraAnnual; j++) {
        const dueDate = new Date(contract.start);
        dueDate.setMonth(dueDate.getMonth() + 12 * (j + 1));

        await fetch('/api/installments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId: contract.unitId,
            contractId: contract.id,
            type: 'دفعة سنوية',
            amount: installmentOptions.annualBonusValue,
            originalAmount: installmentOptions.annualBonusValue,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'غير مدفوع'
          })
        });
      }

      // إنشاء دفعة الصيانة
      if (contract.maintenanceDeposit > 0) {
        const lastInstallment = await fetch('/api/installments?contractId=' + contract.id);
        const installments = await lastInstallment.json();
        const lastDueDate = installments.length > 0
          ? new Date(installments[installments.length - 1].dueDate)
          : new Date(contract.start);

        lastDueDate.setMonth(lastDueDate.getMonth() + months);

        await fetch('/api/installments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId: contract.unitId,
            contractId: contract.id,
            type: 'دفعة صيانة',
            amount: contract.maintenanceDeposit,
            originalAmount: contract.maintenanceDeposit,
            dueDate: lastDueDate.toISOString().split('T')[0],
            status: 'غير مدفوع'
          })
        });
      }
    } catch (error) {
      console.error('Error creating installments:', error);
    }
  };

  const resetForm = () => {
    setNewContract({
      unitId: '',
      customerId: '',
      totalPrice: 0,
      downPayment: 0,
      discountAmount: 0,
      maintenanceDeposit: 0,
      brokerName: '',
      brokerPercent: 0,
      commissionSafeId: '',
      type: 'installment',
      count: 0,
      extraAnnual: 0,
      annualPaymentValue: 0,
      start: today()
    });
    setInstallmentOptions({
      type: 'شهري',
      count: 0,
      extraAnnual: 0,
      annualBonusValue: 0
    });
  };

  const handleExportCSV = () => {
    const headers = ['كود العقد', 'الوحدة', 'العميل', 'السعر', 'المقدم', 'الخصم', 'السمسار', 'نسبة العمولة', 'مبلغ العمولة', 'تاريخ البدء'];
    const rows = filteredContracts.map(c => [
      c.code,
      getUnitDisplayName(unitById(state, c.unitId)),
      (custById(state, c.customerId))?.name || '',
      c.totalPrice,
      c.downPayment,
      c.discountAmount,
      c.brokerName || '',
      c.brokerPercent,
      c.brokerAmount,
      c.start
    ]);
    console.log('Export CSV functionality to be implemented');
  };

  return (
    <div className="contracts">
      <div className="card">
        <div className="header">
          <h3>العقود</h3>
          <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'إلغاء' : 'إضافة عقد جديد'}
          </button>
        </div>

        {showAddForm && (
          <div className="card" style={{ marginTop: '16px' }}>
            <h4>إضافة عقد جديد</h4>

            <div className="grid grid-4" style={{ gap: '10px' }}>
              <select
                className="select"
                value={newContract.unitId}
                onChange={(e) => setNewContract({ ...newContract, unitId: e.target.value })}
              >
                <option value="">اختر الوحدة...</option>
                {state.units.filter(u => u.status === 'متاحة' || u.status === 'محجوزة').map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {getUnitDisplayName(unit)}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={newContract.customerId}
                onChange={(e) => setNewContract({ ...newContract, customerId: e.target.value })}
              >
                <option value="">اختر العميل...</option>
                {state.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <input
                className="input"
                type="number"
                placeholder="السعر الكلي"
                value={newContract.totalPrice}
                onChange={(e) => setNewContract({ ...newContract, totalPrice: parseFloat(e.target.value) || 0 })}
              />

              <select
                className="select"
                value={newContract.type}
                onChange={(e) => setNewContract({ ...newContract, type: e.target.value })}
              >
                <option value="installment">تقسيط</option>
                <option value="cash">كاش</option>
              </select>

              <input
                className="input"
                type="number"
                placeholder="المقدم"
                value={newContract.downPayment}
                onChange={(e) => setNewContract({ ...newContract, downPayment: parseFloat(e.target.value) || 0 })}
              />

              <select
                className="select"
                value={newContract.commissionSafeId}
                onChange={(e) => setNewContract({ ...newContract, commissionSafeId: e.target.value })}
              >
                <option value="">اختر خزنة المقدم...</option>
                {state.safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({egp(safe.balance)})
                  </option>
                ))}
              </select>

              <input
                className="input"
                type="number"
                placeholder="مبلغ الخصم"
                value={newContract.discountAmount}
                onChange={(e) => setNewContract({ ...newContract, discountAmount: parseFloat(e.target.value) || 0 })}
              />

              <input
                className="input"
                type="number"
                placeholder="وديعة الصيانة"
                value={newContract.maintenanceDeposit}
                onChange={(e) => setNewContract({ ...newContract, maintenanceDeposit: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-3" style={{ gap: '10px', marginTop: '10px' }}>
              <input
                className="input"
                placeholder="اسم السمسار"
                value={newContract.brokerName}
                onChange={(e) => setNewContract({ ...newContract, brokerName: e.target.value })}
              />

              <input
                className="input"
                type="number"
                placeholder="نسبة العمولة %"
                value={newContract.brokerPercent}
                onChange={(e) => setNewContract({ ...newContract, brokerPercent: parseFloat(e.target.value) || 0 })}
              />

              <input
                className="input"
                type="date"
                value={newContract.start}
                onChange={(e) => setNewContract({ ...newContract, start: e.target.value })}
              />
            </div>

            {newContract.type === 'installment' && (
              <div className="card" style={{ marginTop: '16px' }}>
                <h5>خيارات الأقساط</h5>
                <div className="grid grid-4" style={{ gap: '10px' }}>
                  <select
                    className="select"
                    value={installmentOptions.type}
                    onChange={(e) => setInstallmentOptions({ ...installmentOptions, type: e.target.value })}
                  >
                    <option value="شهري">شهري</option>
                    <option value="ربع سنوي">ربع سنوي</option>
                    <option value="نصف سنوي">نصف سنوي</option>
                    <option value="سنوي">سنوي</option>
                  </select>

                  <input
                    className="input"
                    type="number"
                    placeholder="عدد الدفعات"
                    value={installmentOptions.count}
                    onChange={(e) => setInstallmentOptions({ ...installmentOptions, count: parseInt(e.target.value) || 0 })}
                  />

                  <input
                    className="input"
                    type="number"
                    placeholder="عدد الدفعات السنوية"
                    value={installmentOptions.extraAnnual}
                    onChange={(e) => setInstallmentOptions({ ...installmentOptions, extraAnnual: parseInt(e.target.value) || 0 })}
                  />

                  <input
                    className="input"
                    type="number"
                    placeholder="قيمة الدفعة السنوية"
                    value={installmentOptions.annualBonusValue}
                    onChange={(e) => setInstallmentOptions({ ...installmentOptions, annualBonusValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px' }}>
                  إجمالي عدد الأقساط: <strong>{updateTotalInstallments()}</strong>
                </p>
              </div>
            )}

            <div className="tools" style={{ marginTop: '16px' }}>
              <button className="btn" onClick={handleCreateContract}>
                إنشاء العقد وتوليد الأقساط
              </button>
            </div>
          </div>
        )}

        <div className="tools" style={{ marginTop: '16px' }}>
          <input
            className="input"
            placeholder="بحث بالكود, الوحدة, العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn secondary" onClick={handleExportCSV}>
            تصدير CSV
          </button>
        </div>

        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>كود العقد</th>
                <th>الوحدة</th>
                <th>العميل</th>
                <th>السعر</th>
                <th>المقدم</th>
                <th>السمسار</th>
                <th>تاريخ البدء</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map(contract => {
                const unit = unitById(state, contract.unitId);
                const customer = custById(state, contract.customerId);
                return (
                  <tr key={contract.id}>
                    <td>{contract.code}</td>
                    <td>{unit ? getUnitDisplayName(unit) : '—'}</td>
                    <td>{customer?.name || '—'}</td>
                    <td>{egp(contract.totalPrice)}</td>
                    <td>{egp(contract.downPayment)}</td>
                    <td>{contract.brokerName || '—'}</td>
                    <td>{contract.start}</td>
                    <td>
                      <button className="btn" onClick={() => console.log('عرض تفاصيل العقد')}>
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    لا توجد عقود
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}