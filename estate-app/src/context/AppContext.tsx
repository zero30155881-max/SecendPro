'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppSettings } from '@/types';
import { uid, logAction } from '@/utils';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveState: () => void;
  loadState: () => Promise<void>;
  persist: () => Promise<void>;
}

type AppAction =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_CUSTOMER'; payload: any }
  | { type: 'UPDATE_CUSTOMER'; payload: { id: string; data: any } }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_UNIT'; payload: any }
  | { type: 'UPDATE_UNIT'; payload: { id: string; data: any } }
  | { type: 'DELETE_UNIT'; payload: string }
  | { type: 'ADD_CONTRACT'; payload: any }
  | { type: 'UPDATE_CONTRACT'; payload: { id: string; data: any } }
  | { type: 'DELETE_CONTRACT'; payload: string }
  | { type: 'ADD_INSTALLMENT'; payload: any }
  | { type: 'UPDATE_INSTALLMENT'; payload: { id: string; data: any } }
  | { type: 'DELETE_INSTALLMENT'; payload: string }
  | { type: 'ADD_VOUCHER'; payload: any }
  | { type: 'DELETE_VOUCHER'; payload: string }
  | { type: 'ADD_SAFE'; payload: any }
  | { type: 'UPDATE_SAFE'; payload: { id: string; data: any } }
  | { type: 'DELETE_SAFE'; payload: string }
  | { type: 'ADD_PARTNER'; payload: any }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; data: any } }
  | { type: 'DELETE_PARTNER'; payload: string }
  | { type: 'ADD_BROKER'; payload: any }
  | { type: 'UPDATE_BROKER'; payload: { id: string; data: any } }
  | { type: 'DELETE_BROKER'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings }
  | { type: 'SET_LOCKED'; payload: boolean }
  | { type: 'ADD_TO_HISTORY'; payload: AppState }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const initialState: AppState = {
  customers: [],
  units: [],
  partners: [],
  unitPartners: [],
  contracts: [],
  installments: [],
  payments: [],
  partnerDebts: [],
  safes: [{ id: uid('S'), name: 'الخزنة الرئيسية', balance: 0 }],
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
    case 'SET_STATE':
      return { ...state, ...action.payload };

    case 'ADD_CUSTOMER':
      logAction(state, 'إضافة عميل جديد', { id: action.payload.id, name: action.payload.name });
      return { ...state, customers: [...state.customers, action.payload] };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c
        )
      };

    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload)
      };

    case 'ADD_UNIT':
      logAction(state, 'إضافة وحدة جديدة', { id: action.payload.id, code: action.payload.code });
      return { ...state, units: [...state.units, action.payload] };

    case 'UPDATE_UNIT':
      return {
        ...state,
        units: state.units.map(u =>
          u.id === action.payload.id ? { ...u, ...action.payload.data } : u
        )
      };

    case 'DELETE_UNIT':
      return {
        ...state,
        units: state.units.filter(u => u.id !== action.payload)
      };

    case 'ADD_CONTRACT':
      logAction(state, 'إنشاء عقد جديد', { contractId: action.payload.id, unitId: action.payload.unitId, customerId: action.payload.customerId, price: action.payload.totalPrice });
      return { ...state, contracts: [...state.contracts, action.payload] };

    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c
        )
      };

    case 'DELETE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter(c => c.id !== action.payload)
      };

    case 'ADD_INSTALLMENT':
      return { ...state, installments: [...state.installments, action.payload] };

    case 'UPDATE_INSTALLMENT':
      return {
        ...state,
        installments: state.installments.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.data } : i
        )
      };

    case 'DELETE_INSTALLMENT':
      return {
        ...state,
        installments: state.installments.filter(i => i.id !== action.payload)
      };

    case 'ADD_VOUCHER':
      return { ...state, vouchers: [...state.vouchers, action.payload] };

    case 'DELETE_VOUCHER':
      return {
        ...state,
        vouchers: state.vouchers.filter(v => v.id !== action.payload)
      };

    case 'ADD_SAFE':
      logAction(state, 'إضافة خزنة جديدة', { safeId: action.payload.id, name: action.payload.name, initialBalance: action.payload.balance });
      return { ...state, safes: [...state.safes, action.payload] };

    case 'UPDATE_SAFE':
      return {
        ...state,
        safes: state.safes.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        )
      };

    case 'DELETE_SAFE':
      return {
        ...state,
        safes: state.safes.filter(s => s.id !== action.payload)
      };

    case 'ADD_PARTNER':
      logAction(state, 'إضافة شريك جديد', { partnerId: action.payload.id, name: action.payload.name });
      return { ...state, partners: [...state.partners, action.payload] };

    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: state.partners.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        )
      };

    case 'DELETE_PARTNER':
      return {
        ...state,
        partners: state.partners.filter(p => p.id !== action.payload)
      };

    case 'ADD_BROKER':
      logAction(state, 'إضافة سمسار جديد', { id: action.payload.id, name: action.payload.name });
      return { ...state, brokers: [...state.brokers, action.payload] };

    case 'UPDATE_BROKER':
      return {
        ...state,
        brokers: state.brokers.map(b =>
          b.id === action.payload.id ? { ...b, ...action.payload.data } : b
        )
      };

    case 'DELETE_BROKER':
      return {
        ...state,
        brokers: state.brokers.filter(b => b.id !== action.payload)
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_LOCKED':
      return { ...state, locked: action.payload };

    case 'ADD_TO_HISTORY':
      return state; // Handled separately

    case 'UNDO':
      return state; // Handled separately

    case 'REDO':
      return state; // Handled separately

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'estate_app_state';
const HISTORY_KEY = 'estate_app_history';
const HISTORY_INDEX_KEY = 'estate_app_history_index';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [historyStack, setHistoryStack] = React.useState<AppState[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const loadState = async (): Promise<void> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        dispatch({ type: 'SET_STATE', payload: parsedState });
      }

      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistoryStack(parsedHistory);
      }

      const storedIndex = localStorage.getItem(HISTORY_INDEX_KEY);
      if (storedIndex) {
        setHistoryIndex(parseInt(storedIndex, 10));
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
    }
  };

  const saveState = (): void => {
    try {
      const newHistory = historyStack.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state)));
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      const newIndex = newHistory.length - 1;

      setHistoryStack(newHistory);
      setHistoryIndex(newIndex);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      localStorage.setItem(HISTORY_INDEX_KEY, newIndex.toString());
    } catch (error) {
      console.error('Failed to save state to history:', error);
    }
  };

  const persist = async (): Promise<void> => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist state to localStorage:', error);
    }
  };

  const undo = (): void => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const restoredState = historyStack[newIndex];

      setHistoryIndex(newIndex);
      dispatch({ type: 'SET_STATE', payload: restoredState });

      localStorage.setItem(HISTORY_INDEX_KEY, newIndex.toString());
    }
  };

  const redo = (): void => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      const restoredState = historyStack[newIndex];

      setHistoryIndex(newIndex);
      dispatch({ type: 'SET_STATE', payload: restoredState });

      localStorage.setItem(HISTORY_INDEX_KEY, newIndex.toString());
    }
  };

  // Load state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    if (state !== initialState) {
      persist();
    }
  }, [state]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    saveState,
    loadState,
    persist
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