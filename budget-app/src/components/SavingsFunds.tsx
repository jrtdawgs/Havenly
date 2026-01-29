'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  PiggyBank,
  Plane,
  Home,
  Car,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  Pause,
  Play,
} from 'lucide-react';
import { SavingsFund } from '@/types/budget';

const iconMap = {
  emergency: PiggyBank,
  vacation: Plane,
  house: Home,
  car: Car,
};

const colorMap: Record<SavingsFund['color'], string> = {
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
};

export function SavingsFunds() {
  const { state, updateSavingsFund, addFundTransaction } = useBudget();
  const { savingsFunds } = state;

  const [editingFund, setEditingFund] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editMonthly, setEditMonthly] = useState('');
  const [transactionFund, setTransactionFund] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');

  const handleStartEdit = (fund: SavingsFund) => {
    setEditingFund(fund.id);
    setEditBalance(fund.balance.toString());
    setEditTarget(fund.target.toString());
    setEditMonthly((fund.monthlyContribution || 0).toString());
  };

  const handleSaveEdit = (fundId: string) => {
    updateSavingsFund(fundId, {
      balance: parseFloat(editBalance) || 0,
      target: parseFloat(editTarget) || 0,
      monthlyContribution: parseFloat(editMonthly) || 0,
    });
    setEditingFund(null);
  };

  const handleTransaction = (fundId: string) => {
    const amount = parseFloat(transactionAmount);
    if (amount > 0) {
      addFundTransaction({
        fundId,
        amount,
        type: transactionType,
        date: new Date().toISOString().split('T')[0],
      });
      setTransactionFund(null);
      setTransactionAmount('');
    }
  };

  const totalSavings = savingsFunds.reduce((sum, f) => sum + f.balance, 0);
  const activeFunds = savingsFunds.filter(f => f.isActive);
  const inactiveFunds = savingsFunds.filter(f => !f.isActive);

  return (
    <div className="space-y-6">
      {/* Total Summary */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Total Savings</h2>
        <p className="text-4xl font-bold text-white">${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-sm text-gray-400 mt-1">Across {savingsFunds.length} funds</p>
      </div>

      {/* Active Funds */}
      {activeFunds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Active Funds</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeFunds.map((fund) => {
              const Icon = iconMap[fund.id as keyof typeof iconMap] || PiggyBank;
              const isEditing = editingFund === fund.id;
              const isTransacting = transactionFund === fund.id;

              return (
                <div
                  key={fund.id}
                  className={`rounded-xl border p-5 ${colorMap[fund.color]}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h4 className="font-semibold text-white">{fund.name}</h4>
                        <p className="text-xs text-gray-400">
                          {fund.isActive ? 'Actively saving' : 'Not saving yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSavingsFund(fund.id, { isActive: false })}
                        className="text-gray-400 hover:text-yellow-400"
                        title="Pause saving"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => isEditing ? handleSaveEdit(fund.id) : handleStartEdit(fund)}
                        className="text-gray-400 hover:text-white"
                      >
                        {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Current Balance</label>
                        <input
                          type="number"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Target</label>
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Monthly Contribution</label>
                        <input
                          type="number"
                          value={editMonthly}
                          onChange={(e) => setEditMonthly(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(fund.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFund(null)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-white">
                          ${fund.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-400">
                          of ${fund.target.toLocaleString()} goal
                        </p>
                        {(fund.monthlyContribution || 0) > 0 && (
                          <p className="text-xs text-green-400 mt-1">
                            +${fund.monthlyContribution}/mo contribution
                          </p>
                        )}
                      </div>

                      <ProgressBar
                        current={fund.balance}
                        target={fund.target}
                        color={fund.color === 'yellow' ? 'yellow' : fund.color === 'blue' ? 'blue' : fund.color === 'purple' ? 'purple' : 'green'}
                        showAmount={false}
                      />

                      {isTransacting ? (
                        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => setTransactionType('deposit')}
                              className={`flex-1 py-1 rounded text-sm ${
                                transactionType === 'deposit'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => setTransactionType('withdrawal')}
                              className={`flex-1 py-1 rounded text-sm ${
                                transactionType === 'withdrawal'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              Withdraw
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={transactionAmount}
                              onChange={(e) => setTransactionAmount(e.target.value)}
                              placeholder="Amount"
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                            />
                            <button
                              onClick={() => handleTransaction(fund.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTransactionFund(null)}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setTransactionFund(fund.id);
                              setTransactionType('deposit');
                            }}
                            className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 rounded text-sm flex items-center justify-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add
                          </button>
                          <button
                            onClick={() => {
                              setTransactionFund(fund.id);
                              setTransactionType('withdrawal');
                            }}
                            className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm flex items-center justify-center gap-1"
                          >
                            <Minus className="w-4 h-4" /> Withdraw
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Funds */}
      {inactiveFunds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-4">Not Saving Yet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveFunds.map((fund) => {
              const Icon = iconMap[fund.id as keyof typeof iconMap] || PiggyBank;
              const isEditing = editingFund === fund.id;

              return (
                <div
                  key={fund.id}
                  className="rounded-xl border border-gray-700 bg-gray-800/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium text-gray-400">{fund.name}</h4>
                        <p className="text-sm text-gray-500">
                          ${fund.balance.toLocaleString()} saved
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSavingsFund(fund.id, { isActive: true })}
                        className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>
                      <button
                        onClick={() => isEditing ? handleSaveEdit(fund.id) : handleStartEdit(fund)}
                        className="text-gray-500 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          placeholder="Balance"
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          placeholder="Target"
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(fund.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFund(null)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
