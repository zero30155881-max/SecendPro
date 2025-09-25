'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Customers from '@/components/Customers';
import Units from '@/components/Units';

const routes = [
  { id: 'dash', title: 'لوحة التحكم', render: () => <Dashboard />, tab: true },
  { id: 'customers', title: 'العملاء', render: () => <Customers />, tab: true },
  { id: 'units', title: 'الوحدات', render: () => <Units />, tab: true },
  { id: 'contracts', title: 'العقود', render: () => <div>Contracts Component</div>, tab: true },
  { id: 'brokers', title: 'السماسرة', render: () => <div>Brokers Component</div>, tab: true },
  { id: 'installments', title: 'الأقساط', render: () => <div>Installments Component</div>, tab: true },
  { id: 'vouchers', title: 'السندات', render: () => <div>Vouchers Component</div>, tab: true },
  { id: 'partners', title: 'الشركاء', render: () => <div>Partners Component</div>, tab: true },
  { id: 'treasury', title: 'الخزينة', render: () => <div>Treasury Component</div>, tab: true },
  { id: 'reports', title: 'التقارير', render: () => <div>Reports Component</div>, tab: true },
];

export default function Home() {
  const [currentView, setCurrentView] = useState('dash');
  const [currentParam, setCurrentParam] = useState(null);

  const handleNavigate = (id: string, param?: any) => {
    setCurrentView(id);
    setCurrentParam(param);
  };

  const currentRoute = routes.find(r => r.id === currentView);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>نظام إدارة العقارات</h1>
        <div className="header-actions">
          <button className="btn secondary">إعدادات</button>
          <button className="btn secondary">نسخة احتياطية</button>
        </div>
      </header>

      <Navigation
        routes={routes}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      <main className="main-content">
        {currentRoute ? currentRoute.render() : <Dashboard />}
      </main>
    </div>
  );
}