'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Target, Plus, Check, Info, Trash2 } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function RothIRATracker() {
  const { state, addRothIraContribution, deleteRothIraContribution } = useBudget();
  const { config, rothIraContributions } = state;

  const [newAmount, setNewAmount] = useState(config.rothIraMonthly.toString());
  const [newMonth, setNewMonth] = useState(MONTHS[new Date().getMonth()]);

  const totalContributed = rothIraContributions.reduce((sum, c) => sum + c.amount, 0);
  const remaining = config.rothIraAnnualLimit - totalContributed;
  const monthsLeft = 12 - new Date().getMonth();
  const neededPerMonth = remaining / monthsLeft;

  const handleAdd = () => {
    const amount = parseFloat(newAmount);
    if (amount > 0) {
      addRothIraContribution({
        month: newMonth,
        amount,
        date: new Date().toISOString().split('T')[0],
      });
      setNewAmount(config.rothIraMonthly.toString());
    }
  };

  // Get contributions by month
  const contributionsByMonth = MONTHS.map(month => {
    const monthContribs = rothIraContributions.filter(c => c.month === month);
    return {
      month,
      total: monthContribs.reduce((sum, c) => sum + c.amount, 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Why Max Roth IRA */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-400 mb-2">Why Max Your Roth IRA?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Tax-FREE growth forever - never pay taxes on gains</li>
              <li>First $10k can go toward house (first-time homebuyer)</li>
              <li>Can withdraw contributions anytime tax/penalty free</li>
              <li>$7,500/year limit - USE IT OR LOSE IT</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">2025 Progress</h3>
        </div>

        <ProgressBar
          current={totalContributed}
          target={config.rothIraAnnualLimit}
          color="purple"
          size="lg"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">${totalContributed.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Contributed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">${remaining.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{monthsLeft}</p>
            <p className="text-sm text-gray-400">Months Left</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">${neededPerMonth > 0 ? neededPerMonth.toFixed(0) : '0'}</p>
            <p className="text-sm text-gray-400">Needed/Mo to Max</p>
          </div>
        </div>
      </div>

      {/* Add Contribution */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Log Contribution</h3>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400 mb-1">Month</label>
            <select
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              placeholder="583.33"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAdd}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Breakdown</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {contributionsByMonth.map(({ month, total }) => {
            const target = config.rothIraMonthly;
            const isComplete = total >= target;
            const currentMonth = MONTHS[new Date().getMonth()];
            const isPast = MONTHS.indexOf(month) < MONTHS.indexOf(currentMonth);

            return (
              <div
                key={month}
                className={`p-3 rounded-lg border ${
                  isComplete
                    ? 'bg-green-500/10 border-green-500/30'
                    : isPast && total === 0
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{month.slice(0, 3)}</span>
                  {isComplete && <Check className="w-4 h-4 text-green-400" />}
                </div>
                <p className={`font-semibold ${isComplete ? 'text-green-400' : 'text-white'}`}>
                  ${total.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contribution History */}
      {rothIraContributions.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Contribution History</h3>

          <div className="space-y-2">
            {rothIraContributions.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg"
              >
                <div>
                  <span className="text-white">{c.month}</span>
                  {c.date && (
                    <span className="text-gray-400 text-sm ml-2">({c.date})</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">
                    +${c.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteRothIraContribution(c.id)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
