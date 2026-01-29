'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { BudgetTracker } from '@/components/BudgetTracker';
import { RothIRATracker } from '@/components/RothIRATracker';
import { CreditCardTracker } from '@/components/CreditCardTracker';
import { WorkExpenseTracker } from '@/components/WorkExpenseTracker';
import { SavingsFunds } from '@/components/SavingsFunds';
import { Settings } from '@/components/Settings';
import {
  LayoutDashboard,
  Receipt,
  Target,
  CreditCard,
  Briefcase,
  PiggyBank,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react';

type Tab = 'dashboard' | 'budget' | 'rothira' | 'creditcard' | 'expenses' | 'savings' | 'settings';

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Receipt },
  { id: 'rothira', label: 'Roth IRA', icon: Target },
  { id: 'savings', label: 'Savings Funds', icon: PiggyBank },
  { id: 'creditcard', label: 'Credit Card', icon: CreditCard },
  { id: 'expenses', label: 'Work Expenses', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'budget':
        return <BudgetTracker />;
      case 'rothira':
        return <RothIRATracker />;
      case 'creditcard':
        return <CreditCardTracker />;
      case 'expenses':
        return <WorkExpenseTracker />;
      case 'savings':
        return <SavingsFunds />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Havenly</h1>
              <p className="text-sm text-gray-400">Your financial haven</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800/50 border-b border-gray-700 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Data saved locally in your browser</p>
        </div>
      </footer>
    </div>
  );
}
