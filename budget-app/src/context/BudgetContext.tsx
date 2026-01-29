'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  BudgetState,
  DEFAULT_STATE,
  WorkExpense,
  RothIRAContribution,
  EmergencyFundEntry,
  PaycheckEntry,
  CreditCardPayment,
  BudgetConfig,
  SavingsFund,
  FundTransaction,
  CreditCardDebt,
  BudgetTransaction,
  CustomCategory,
  MonthlyBudgetOverride,
} from '@/types/budget';
import { saveData, loadData, clearData } from '@/lib/storage';

interface BudgetContextType {
  state: BudgetState;
  updateConfig: (config: Partial<BudgetConfig>) => void;
  addWorkExpense: (expense: Omit<WorkExpense, 'id'>) => void;
  updateWorkExpense: (id: string, expense: Partial<WorkExpense>) => void;
  deleteWorkExpense: (id: string) => void;
  addRothIraContribution: (contribution: Omit<RothIRAContribution, 'id'>) => void;
  deleteRothIraContribution: (id: string) => void;
  addEmergencyFundEntry: (entry: Omit<EmergencyFundEntry, 'id'>) => void;
  updateEmergencyFundBalance: (balance: number) => void;
  addPaycheck: (paycheck: Omit<PaycheckEntry, 'id'>) => void;
  updateCreditCardPayment: (id: string, updates: Partial<CreditCardPayment>) => void;
  updateCreditCard: (updates: Partial<CreditCardDebt>) => void;
  addCreditCardPayment: (payment: Omit<CreditCardPayment, 'id'>) => void;
  deleteCreditCardPayment: (id: string) => void;
  updateSavingsFund: (id: string, updates: Partial<SavingsFund>) => void;
  addFundTransaction: (transaction: Omit<FundTransaction, 'id'>) => void;
  addBudgetTransaction: (transaction: Omit<BudgetTransaction, 'id'>) => void;
  deleteBudgetTransaction: (id: string) => void;
  reorderWorkExpenses: (fromIndex: number, toIndex: number) => void;
  addCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  updateCustomCategory: (id: string, updates: Partial<CustomCategory>) => void;
  deleteCustomCategory: (id: string) => void;
  setMonthlyBudgetOverride: (month: string, totalBudget: number) => void;
  deleteMonthlyBudgetOverride: (month: string) => void;
  resetState: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BudgetState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount (supports both Tauri and localStorage)
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await loadData();
        if (saved) {
          // Merge savings funds with defaults to ensure monthlyContribution exists
          const mergedFunds = (saved.savingsFunds || DEFAULT_STATE.savingsFunds).map((fund: SavingsFund) => {
            const defaultFund = DEFAULT_STATE.savingsFunds.find(f => f.id === fund.id);
            return {
              ...fund,
              monthlyContribution: fund.monthlyContribution ?? defaultFund?.monthlyContribution ?? 0,
            };
          });
          // Merge with defaults to ensure new fields are present
          setState({
            ...DEFAULT_STATE,
            ...saved,
            config: { ...DEFAULT_STATE.config, ...saved.config },
            savingsFunds: mergedFunds,
            fundTransactions: saved.fundTransactions || [],
            budgetTransactions: saved.budgetTransactions || [],
            customCategories: saved.customCategories || [],
            monthlyBudgetOverrides: saved.monthlyBudgetOverrides || [],
          });
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  // Save data on state change (debounced)
  useEffect(() => {
    if (isLoaded) {
      // Debounce saves to avoid excessive writes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(state).catch(error => {
          console.error('Failed to save state:', error);
        });
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoaded]);

  const updateConfig = useCallback((config: Partial<BudgetConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const addWorkExpense = useCallback((expense: Omit<WorkExpense, 'id'>) => {
    setState(prev => ({
      ...prev,
      workExpenses: [
        ...prev.workExpenses,
        { ...expense, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateWorkExpense = useCallback((id: string, expense: Partial<WorkExpense>) => {
    setState(prev => ({
      ...prev,
      workExpenses: prev.workExpenses.map(e =>
        e.id === id ? { ...e, ...expense } : e
      ),
    }));
  }, []);

  const deleteWorkExpense = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      workExpenses: prev.workExpenses.filter(e => e.id !== id),
    }));
  }, []);

  const addRothIraContribution = useCallback((contribution: Omit<RothIRAContribution, 'id'>) => {
    setState(prev => ({
      ...prev,
      rothIraContributions: [
        ...prev.rothIraContributions,
        { ...contribution, id: Date.now().toString() },
      ],
    }));
  }, []);

  const deleteRothIraContribution = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      rothIraContributions: prev.rothIraContributions.filter(c => c.id !== id),
    }));
  }, []);

  const addEmergencyFundEntry = useCallback((entry: Omit<EmergencyFundEntry, 'id'>) => {
    setState(prev => ({
      ...prev,
      emergencyFundEntries: [
        ...prev.emergencyFundEntries,
        { ...entry, id: Date.now().toString() },
      ],
      emergencyFundBalance: prev.emergencyFundBalance + entry.amount,
    }));
  }, []);

  const updateEmergencyFundBalance = useCallback((balance: number) => {
    setState(prev => ({
      ...prev,
      emergencyFundBalance: balance,
      // Also update the emergency fund in savingsFunds
      savingsFunds: prev.savingsFunds.map(f =>
        f.id === 'emergency' ? { ...f, balance } : f
      ),
    }));
  }, []);

  const addPaycheck = useCallback((paycheck: Omit<PaycheckEntry, 'id'>) => {
    setState(prev => ({
      ...prev,
      paychecks: [
        ...prev.paychecks,
        { ...paycheck, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateCreditCardPayment = useCallback((id: string, updates: Partial<CreditCardPayment>) => {
    setState(prev => ({
      ...prev,
      creditCard: {
        ...prev.creditCard,
        payments: prev.creditCard.payments.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    }));
  }, []);

  const updateCreditCard = useCallback((updates: Partial<CreditCardDebt>) => {
    setState(prev => ({
      ...prev,
      creditCard: { ...prev.creditCard, ...updates },
    }));
  }, []);

  const addCreditCardPayment = useCallback((payment: Omit<CreditCardPayment, 'id'>) => {
    setState(prev => ({
      ...prev,
      creditCard: {
        ...prev.creditCard,
        payments: [
          ...prev.creditCard.payments,
          { ...payment, id: Date.now().toString() },
        ],
      },
    }));
  }, []);

  const deleteCreditCardPayment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      creditCard: {
        ...prev.creditCard,
        payments: prev.creditCard.payments.filter(p => p.id !== id),
      },
    }));
  }, []);

  const updateSavingsFund = useCallback((id: string, updates: Partial<SavingsFund>) => {
    setState(prev => ({
      ...prev,
      savingsFunds: prev.savingsFunds.map(f =>
        f.id === id ? { ...f, ...updates } : f
      ),
      // Keep emergencyFundBalance in sync if updating emergency fund
      ...(id === 'emergency' && updates.balance !== undefined
        ? { emergencyFundBalance: updates.balance }
        : {}),
    }));
  }, []);

  const addFundTransaction = useCallback((transaction: Omit<FundTransaction, 'id'>) => {
    setState(prev => {
      const fund = prev.savingsFunds.find(f => f.id === transaction.fundId);
      if (!fund) return prev;

      const balanceChange = transaction.type === 'withdrawal'
        ? -transaction.amount
        : transaction.amount;

      return {
        ...prev,
        fundTransactions: [
          ...prev.fundTransactions,
          { ...transaction, id: Date.now().toString() },
        ],
        savingsFunds: prev.savingsFunds.map(f =>
          f.id === transaction.fundId
            ? { ...f, balance: f.balance + balanceChange }
            : f
        ),
        // Keep emergencyFundBalance in sync
        ...(transaction.fundId === 'emergency'
          ? { emergencyFundBalance: fund.balance + balanceChange }
          : {}),
      };
    });
  }, []);

  const addBudgetTransaction = useCallback((transaction: Omit<BudgetTransaction, 'id'>) => {
    setState(prev => ({
      ...prev,
      budgetTransactions: [
        ...prev.budgetTransactions,
        { ...transaction, id: Date.now().toString() },
      ],
    }));
  }, []);

  const deleteBudgetTransaction = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      budgetTransactions: prev.budgetTransactions.filter(t => t.id !== id),
    }));
  }, []);

  const reorderWorkExpenses = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newExpenses = [...prev.workExpenses];
      const [removed] = newExpenses.splice(fromIndex, 1);
      newExpenses.splice(toIndex, 0, removed);
      return {
        ...prev,
        workExpenses: newExpenses,
      };
    });
  }, []);

  const addCustomCategory = useCallback((category: Omit<CustomCategory, 'id'>) => {
    setState(prev => ({
      ...prev,
      customCategories: [
        ...prev.customCategories,
        { ...category, id: `custom_${Date.now()}` },
      ],
    }));
  }, []);

  const updateCustomCategory = useCallback((id: string, updates: Partial<CustomCategory>) => {
    setState(prev => ({
      ...prev,
      customCategories: prev.customCategories.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteCustomCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(c => c.id !== id),
    }));
  }, []);

  const setMonthlyBudgetOverride = useCallback((month: string, totalBudget: number) => {
    setState(prev => {
      const existing = prev.monthlyBudgetOverrides.find(o => o.month === month);
      if (existing) {
        return {
          ...prev,
          monthlyBudgetOverrides: prev.monthlyBudgetOverrides.map(o =>
            o.month === month ? { ...o, totalBudget } : o
          ),
        };
      }
      return {
        ...prev,
        monthlyBudgetOverrides: [
          ...prev.monthlyBudgetOverrides,
          { month, totalBudget },
        ],
      };
    });
  }, []);

  const deleteMonthlyBudgetOverride = useCallback((month: string) => {
    setState(prev => ({
      ...prev,
      monthlyBudgetOverrides: prev.monthlyBudgetOverrides.filter(o => o.month !== month),
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
    clearData().catch(error => {
      console.error('Failed to clear data:', error);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BudgetContext.Provider
      value={{
        state,
        updateConfig,
        addWorkExpense,
        updateWorkExpense,
        deleteWorkExpense,
        addRothIraContribution,
        deleteRothIraContribution,
        addEmergencyFundEntry,
        updateEmergencyFundBalance,
        addPaycheck,
        updateCreditCardPayment,
        updateCreditCard,
        addCreditCardPayment,
        deleteCreditCardPayment,
        updateSavingsFund,
        addFundTransaction,
        addBudgetTransaction,
        deleteBudgetTransaction,
        reorderWorkExpenses,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
        setMonthlyBudgetOverride,
        deleteMonthlyBudgetOverride,
        resetState,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
