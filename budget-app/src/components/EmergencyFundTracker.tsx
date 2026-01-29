'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PiggyBank, Plus, Target, Calendar } from 'lucide-react';

export function EmergencyFundTracker() {
  const { state, addEmergencyFundEntry, updateEmergencyFundBalance } = useBudget();
  const { config, emergencyFundBalance, emergencyFundEntries } = state;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState(config.emergencyFundMonthly.toString());
  const [showSetBalance, setShowSetBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(emergencyFundBalance.toString());

  const remaining = config.emergencyFundTarget - emergencyFundBalance;
  const monthsToGoal = remaining > 0 ? Math.ceil(remaining / config.emergencyFundMonthly) : 0;
  const percentComplete = (emergencyFundBalance / config.emergencyFundTarget) * 100;

  const handleAddEntry = () => {
    const amount = parseFloat(newAmount);
    if (amount > 0) {
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      addEmergencyFundEntry({
        month,
        amount,
        date: new Date().toISOString().split('T')[0],
      });
      setNewAmount(config.emergencyFundMonthly.toString());
      setShowAddForm(false);
    }
  };

  const handleSetBalance = () => {
    const balance = parseFloat(newBalance);
    if (balance >= 0) {
      updateEmergencyFundBalance(balance);
      setShowSetBalance(false);
    }
  };

  // Milestones
  const milestones = [
    { amount: 1000, label: 'Starter Emergency Fund' },
    { amount: 5000, label: '2 Months Expenses' },
    { amount: 10000, label: '4 Months Expenses' },
    { amount: 15000, label: '6 Months - GOAL!' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <PiggyBank className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Emergency Fund</h2>
        </div>

        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-green-400">
            ${emergencyFundBalance.toLocaleString()}
          </p>
          <p className="text-gray-400 mt-1">
            of ${config.emergencyFundTarget.toLocaleString()} goal
          </p>
        </div>

        <ProgressBar
          current={emergencyFundBalance}
          target={config.emergencyFundTarget}
          color="green"
          size="lg"
        />

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowSetBalance(!showSetBalance)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
          >
            Set Current Balance
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Contribution
          </button>
        </div>

        {/* Set Balance Form */}
        {showSetBalance && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <label className="block text-sm text-gray-400 mb-2">Current Balance</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <button
                onClick={handleSetBalance}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Set
              </button>
            </div>
          </div>
        )}

        {/* Add Contribution Form */}
        {showAddForm && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <label className="block text-sm text-gray-400 mb-2">Contribution Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <button
                onClick={handleAddEntry}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <Target className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">${remaining.toLocaleString()}</p>
          <p className="text-sm text-gray-400">To Goal</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{monthsToGoal}</p>
          <p className="text-sm text-gray-400">Months Left</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">${config.emergencyFundMonthly}</p>
          <p className="text-sm text-gray-400">Monthly Goal</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{percentComplete.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">Complete</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Milestones</h3>

        <div className="space-y-4">
          {milestones.map((milestone) => {
            const reached = emergencyFundBalance >= milestone.amount;
            const progress = Math.min((emergencyFundBalance / milestone.amount) * 100, 100);

            return (
              <div key={milestone.amount}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm ${reached ? 'text-green-400' : 'text-gray-400'}`}>
                    {reached ? '✓ ' : ''}{milestone.label}
                  </span>
                  <span className={`text-sm font-medium ${reached ? 'text-green-400' : 'text-gray-400'}`}>
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${reached ? 'bg-green-500' : 'bg-gray-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contribution History */}
      {emergencyFundEntries.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Contribution History</h3>

          <div className="space-y-2">
            {emergencyFundEntries.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg"
              >
                <div>
                  <span className="text-white">{entry.month}</span>
                  {entry.date && (
                    <span className="text-gray-400 text-sm ml-2">({entry.date})</span>
                  )}
                </div>
                <span className="text-green-400 font-semibold">
                  +${entry.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
