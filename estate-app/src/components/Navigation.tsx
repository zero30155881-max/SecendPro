'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { NavigationRoute } from '@/types';

interface NavigationProps {
  routes: NavigationRoute[];
  currentView: string;
  onNavigate: (id: string, param?: any) => void;
}

export default function Navigation({ routes, currentView, onNavigate }: NavigationProps) {
  const { state } = useApp();

  const tabRoutes = routes.filter(route => route.tab);

  return (
    <div className="navigation">
      <div className="tabs" id="tabs">
        {tabRoutes.map(route => (
          <button
            key={route.id}
            className={`tab ${currentView === route.id ? 'active' : ''}`}
            id={`tab-${route.id}`}
            onClick={() => onNavigate(route.id)}
          >
            {route.title}
          </button>
        ))}
      </div>
    </div>
  );
}