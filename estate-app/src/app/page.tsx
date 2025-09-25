'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Customers from '@/components/Customers';
import Units from '@/components/Units';
import Contracts from '@/components/Contracts';
import Installments from '@/components/Installments';
import Brokers from '@/components/Brokers';
import Partners from '@/components/Partners';
import Treasury from '@/components/Treasury';
import Vouchers from '@/components/Vouchers';
import Reports from '@/components/Reports';
import Backup from '@/components/Backup';

const routes = [
  { id: 'dash', title: 'لوحة التحكم', render: () => <Dashboard />, tab: true },
  { id: 'customers', title: 'العملاء', render: () => <Customers />, tab: true },
  { id: 'units', title: 'الوحدات', render: () => <Units />, tab: true },
  { id: 'contracts', title: 'العقود', render: () => <Contracts />, tab: true },
  { id: 'brokers', title: 'السماسرة', render: () => <Brokers />, tab: true },
  { id: 'installments', title: 'الأقساط', render: () => <Installments />, tab: true },
  { id: 'vouchers', title: 'السندات', render: () => <Vouchers />, tab: true },
  { id: 'partners', title: 'الشركاء', render: () => <Partners />, tab: true },
  { id: 'treasury', title: 'الخزينة', render: () => <Treasury />, tab: true },
  { id: 'reports', title: 'التقارير', render: () => <Reports />, tab: true },
  { id: 'backup', title: 'النسخة الاحتياطية', render: () => <Backup />, tab: true },
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