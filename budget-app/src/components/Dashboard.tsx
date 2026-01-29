'use client';

import { useBudget } from '@/context/BudgetContext';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Briefcase,
  Target,
  Wallet,
  Plane,
  Home,
  Car,
} from 'lucide-react';

const fundIcons: Record<string, typeof PiggyBank> = {
  emergency: PiggyBank,
  vacation: Plane,
  house: Home,
  car: Car,
};

export function Dashboard() {
  const { state } = useBudget();
  const { config, creditCard, workExpenses, rothIraContributions, savingsFunds } = state;

  // Calculations (paid twice a month = 2 paychecks/month)
  const monthlyNet = config.netPayPerPaycheck * 2;

  const fixedExpenses = config.rent + config.power + config.internet + config.gas + config.groceries + config.gym + config.funMoneyMonthly;
  const ccPaymentRemaining = creditCard.payments.filter(p => !p.paid).length;
  const currentCCPayment = ccPaymentRemaining > 0 ? creditCard.monthlyPayment : 0;
  const totalFixed = fixedExpenses + currentCCPayment;

  const remainingAfterFixed = monthlyNet - totalFixed;

  // Get fund contributions from savingsFunds (single source of truth)
  const emergencyFund = savingsFunds.find(f => f.id === 'emergency');
  const vacationFund = savingsFunds.find(f => f.id === 'vacation');
  const emergencyMonthly = emergencyFund?.monthlyContribution || 0;
  const vacationMonthly = vacationFund?.monthlyContribution || 0;

  const totalSavingsAllocation = config.rothIraMonthly + emergencyMonthly + vacationMonthly;

  // Rate calculations (paid twice a month = 2 paychecks/month)
  const grossMonthly = config.annualSalary / 12;
  const monthlyRoth401k = config.roth401kPerPaycheck * 2;
  const monthlyHSA = config.hsaPerPaycheck * 2;
  const monthlyEmployerMatch = (config.annualSalary * config.employerMatchPercent / 100) / 12;

  // Retirement Rate: 401k + IRA + Employer Match (Ramsey's 15% target)
  const monthlyRetirement = monthlyRoth401k + config.rothIraMonthly + monthlyEmployerMatch;
  const retirementPercent = (monthlyRetirement / grossMonthly) * 100;

  // Savings Funds Rate: Sum of all fund monthly contributions + HSA
  const monthlySavingsFunds = savingsFunds.reduce((sum, f) => sum + (f.monthlyContribution || 0), 0) + monthlyHSA;
  const savingsFundsPercent = (monthlySavingsFunds / grossMonthly) * 100;

  // Total Savings Rate: Everything combined
  const totalMonthlySavings = monthlyRetirement + monthlySavingsFunds;
  const savingsPercent = (totalMonthlySavings / grossMonthly) * 100;

  // Roth IRA progress
  const rothIraTotal = rothIraContributions.reduce((sum, c) => sum + c.amount, 0);

  // Work expense float
  const pendingExpenses = workExpenses
    .filter(e => e.status === 'Pending' || e.status === 'Submitted')
    .reduce((sum, e) => sum + e.amount, 0);

  // Total savings across all funds
  const totalSavingsBalance = savingsFunds.reduce((sum, f) => sum + f.balance, 0);
  const activeFunds = savingsFunds.filter(f => f.isActive);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Monthly Net Income"
          value={`$${monthlyNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle={`$${config.netPayPerPaycheck.toLocaleString()} per paycheck`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Savings"
          value={`$${totalSavingsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Across ${savingsFunds.length} funds`}
          icon={PiggyBank}
          color="blue"
        />
        <StatCard
          title="Savings Funds Rate"
          value={`${savingsFundsPercent.toFixed(1)}%`}
          subtitle={`$${monthlySavingsFunds.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo to ${activeFunds.length} funds`}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Retirement Rate"
          value={`${retirementPercent.toFixed(1)}%`}
          subtitle={`$${monthlyRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo (15% target)`}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsPercent.toFixed(1)}%`}
          subtitle={`$${totalMonthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo (20% target)`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Progress Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roth IRA Progress */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Roth IRA Progress (2025)</h3>
          </div>
          <ProgressBar
            current={rothIraTotal}
            target={config.rothIraAnnualLimit}
            color="purple"
            size="lg"
          />
        </div>

        {/* Savings Funds Overview */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Savings Funds</h3>
          </div>
          <div className="space-y-3">
            {savingsFunds.map((fund) => {
              const Icon = fundIcons[fund.id] || PiggyBank;
              const colorClass = fund.color === 'green' ? 'text-green-400' :
                                 fund.color === 'blue' ? 'text-blue-400' :
                                 fund.color === 'purple' ? 'text-purple-400' :
                                 fund.color === 'yellow' ? 'text-yellow-400' : 'text-pink-400';
              return (
                <div key={fund.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className={`text-sm ${fund.isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                      {fund.name}
                    </span>
                    {!fund.isActive && (
                      <span className="text-xs text-gray-600">(inactive)</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${fund.isActive ? 'text-white' : 'text-gray-500'}`}>
                      ${fund.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {(fund.monthlyContribution || 0) > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        +${fund.monthlyContribution}/mo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fixed Expenses */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Fixed Expenses</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Rent</span>
              <span className="text-white">${config.rent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Groceries</span>
              <span className="text-white">${config.groceries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Power</span>
              <span className="text-white">${config.power}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Internet</span>
              <span className="text-white">${config.internet}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gas</span>
              <span className="text-white">${config.gas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fun Money</span>
              <span className="text-white">${config.funMoneyMonthly}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gym</span>
              <span className="text-white">${config.gym}</span>
            </div>
            {currentCCPayment > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>CC Payment ({ccPaymentRemaining} left)</span>
                <span>${currentCCPayment}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
              <span className="text-gray-300">Total</span>
              <span className="text-white">${totalFixed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Savings Allocation */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Savings Plan</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-purple-400">Roth IRA</span>
              <span className="text-white">${config.rothIraMonthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Emergency Fund</span>
              <span className="text-white">${emergencyMonthly}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">Vacation Fund</span>
              <span className="text-white">${vacationMonthly}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
              <span className="text-gray-300">Total</span>
              <span className="text-white">${totalSavingsAllocation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Buffer</span>
              <span className="text-gray-400">
                ${(remainingAfterFixed - totalSavingsAllocation).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">Credit Card</span>
              </div>
              <p className="text-white">
                {ccPaymentRemaining > 0
                  ? `${ccPaymentRemaining} payments remaining`
                  : creditCard.totalAmount > 0 ? 'Paid off!' : 'No debt'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">Work Expense Float</span>
              </div>
              <p className={pendingExpenses > config.netPayPerPaycheck ? 'text-yellow-400' : 'text-white'}>
                ${pendingExpenses.toLocaleString()} pending
              </p>
              {pendingExpenses > config.netPayPerPaycheck && (
                <p className="text-xs text-yellow-400 mt-1">
                  Exceeds 1 paycheck - monitor closely
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Auto-Deducted Savings</span>
              </div>
              <p className="text-white">
                ${(monthlyRoth401k + monthlyHSA).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
              </p>
              <p className="text-xs text-gray-500">Roth 401k + HSA (already deducted)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
