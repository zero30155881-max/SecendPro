'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppSettings, Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker, PartnerDebt } from '@/types';
import { uid } from '@/utils';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_UNITS'; payload: Unit[] }
  | { type: 'SET_PARTNERS'; payload: Partner[] }
  | { type: 'SET_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_INSTALLMENTS'; payload: Installment[] }
  | { type: 'SET_SAFES'; payload: Safe[] }
  | { type: 'SET_VOUCHERS'; payload: Voucher[] }
  | { type: 'SET_BROKERS'; payload: Broker[] }
  | { type: 'SET_PARTNER_DEBTS'; payload: PartnerDebt[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_UNIT'; payload: Unit }
  | { type: 'UPDATE_UNIT'; payload: Unit }
  | { type: 'DELETE_UNIT'; payload: string };

const initialState: AppState = {
  customers: [],
  units: [],
  partners: [],
  unitPartners: [],
  contracts: [],
  installments: [],
  payments: [],
  partnerDebts: [],
  safes: [],
  transfers: [],
  auditLog: [],
  vouchers: [],
  brokerDues: [],
  brokers: [],
  partnerGroups: [],
  settings: { theme: 'dark', font: 16, pass: null },
  locked: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };

    case 'SET_UNITS':
      return { ...state, units: action.payload };

    case 'SET_PARTNERS':
      return { ...state, partners: action.payload };

    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload };

    case 'SET_INSTALLMENTS':
      return { ...state, installments: action.payload };

    case 'SET_SAFES':
      return { ...state, safes: action.payload };

    case 'SET_VOUCHERS':
      return { ...state, vouchers: action.payload };

    case 'SET_BROKERS':
      return { ...state, brokers: action.payload };

    case 'SET_PARTNER_DEBTS':
      return { ...state, partnerDebts: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? action.payload : c
        )
      };

    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload)
      };

    case 'ADD_UNIT':
      return { ...state, units: [...state.units, action.payload] };

    case 'UPDATE_UNIT':
      return {
        ...state,
        units: state.units.map(u =>
          u.id === action.payload.id ? action.payload : u
        )
      };

    case 'DELETE_UNIT':
      return {
        ...state,
        units: state.units.filter(u => u.id !== action.payload)
      };

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, { ...initialState, loading: true });

  const loadData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // تحميل البيانات من API routes
      const [
        customersRes,
        unitsRes,
        partnersRes,
        safesRes,
        settingsRes
      ] = await Promise.all([
        fetch('/api/customers').then(res => res.json()),
        fetch('/api/units').then(res => res.json()),
        fetch('/api/partners').then(res => res.json()),
        fetch('/api/safes').then(res => res.json()),
        fetch('/api/settings').then(res => res.json())
      ]);

      // تحديث الحالة
      dispatch({ type: 'SET_CUSTOMERS', payload: customersRes });
      dispatch({ type: 'SET_UNITS', payload: unitsRes });
      dispatch({ type: 'SET_PARTNERS', payload: partnersRes });
      dispatch({ type: 'SET_CONTRACTS', payload: [] });
      dispatch({ type: 'SET_INSTALLMENTS', payload: [] });
      dispatch({ type: 'SET_SAFES', payload: safesRes });
      dispatch({ type: 'SET_VOUCHERS', payload: [] });
      dispatch({ type: 'SET_BROKERS', payload: [] });
      dispatch({ type: 'SET_PARTNER_DEBTS', payload: [] });
      dispatch({ type: 'SET_SETTINGS', payload: settingsRes });

    } catch (error) {
      console.error('Error loading data:', error);
      // يمكن إضافة معالجة أخطاء أفضل هنا
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    loadData,
    refreshData
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}