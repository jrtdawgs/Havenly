'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CreditCard, Check, PartyPopper, ArrowRight, Plus, Trash2, Edit2 } from 'lucide-react';

export function CreditCardTracker() {
  const { state, updateCreditCardPayment, updateCreditCard, addCreditCardPayment, deleteCreditCardPayment } = useBudget();
  const { creditCard, config } = state;

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState(creditCard.monthlyPayment.toString());
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [newTotalAmount, setNewTotalAmount] = useState(creditCard.totalAmount.toString());
  const [newMonthlyPayment, setNewMonthlyPayment] = useState(creditCard.monthlyPayment.toString());

  const paidPayments = creditCard.payments.filter(p => p.paid);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingPayments = creditCard.payments.filter(p => !p.paid);
  const remainingAmount = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

  const isPaidOff = remainingPayments.length === 0 || creditCard.totalAmount === 0;

  const handleTogglePayment = (id: string, currentPaid: boolean) => {
    updateCreditCardPayment(id, {
      paid: !currentPaid,
      datePaid: !currentPaid ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const handleAddPayment = () => {
    const amount = parseFloat(newPaymentAmount);
    if (amount > 0) {
      const nextMonth = creditCard.payments.length + 1;
      addCreditCardPayment({
        month: nextMonth,
        amount,
        paid: false,
      });
      setShowAddPayment(false);
      setNewPaymentAmount(creditCard.monthlyPayment.toString());
    }
  };

  const handleSaveBalance = () => {
    const total = parseFloat(newTotalAmount) || 0;
    const monthly = parseFloat(newMonthlyPayment) || 0;
    updateCreditCard({
      totalAmount: total,
      monthlyPayment: monthly,
    });
    setShowEditBalance(false);
  };

  const handleClearAll = () => {
    updateCreditCard({
      totalAmount: 0,
      monthlyPayment: 0,
      payments: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl border p-6 ${
        isPaidOff
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPaidOff ? (
              <>
                <PartyPopper className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-green-400">Credit Card Paid Off!</h2>
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-yellow-400">
                  {remainingPayments.length} Payment{remainingPayments.length !== 1 ? 's' : ''} Remaining
                </h2>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setShowEditBalance(!showEditBalance);
              setNewTotalAmount(creditCard.totalAmount.toString());
              setNewMonthlyPayment(creditCard.monthlyPayment.toString());
            }}
            className="text-gray-400 hover:text-white"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {showEditBalance && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Edit Credit Card Balance</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400">Total Balance</label>
                <input
                  type="number"
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Monthly Payment</label>
                <input
                  type="number"
                  value={newMonthlyPayment}
                  onChange={(e) => setNewMonthlyPayment(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBalance}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowEditBalance(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isPaidOff && creditCard.totalAmount > 0 && (
          <ProgressBar
            current={totalPaid}
            target={creditCard.totalAmount}
            color="yellow"
            size="lg"
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">${creditCard.totalAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Original Balance</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Paid Off</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">${remainingAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Remaining</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">${creditCard.monthlyPayment}</p>
          <p className="text-sm text-gray-400">Per Payment</p>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Payment Schedule</h3>
          <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        </div>

        {showAddPayment && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <input
                type="number"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                placeholder="Payment amount"
                className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleAddPayment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddPayment(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {creditCard.payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No payments scheduled</p>
            <p className="text-sm">Add a payment or set a balance above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creditCard.payments.map((payment, index) => {
              const runningBalance = Math.round(
                (creditCard.totalAmount -
                  creditCard.payments.slice(0, index + 1).reduce((sum, p) => sum + p.amount, 0)) * 100
              ) / 100;

              return (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    payment.paid
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-gray-700/50 border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleTogglePayment(payment.id, payment.paid)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        payment.paid
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-500 hover:border-green-500'
                      }`}
                    >
                      {payment.paid && <Check className="w-4 h-4 text-white" />}
                    </button>

                    <div>
                      <p className={`font-medium ${payment.paid ? 'text-green-400' : 'text-white'}`}>
                        Payment {payment.month}
                      </p>
                      {payment.datePaid && (
                        <p className="text-sm text-gray-400">Paid on {payment.datePaid}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-semibold ${payment.paid ? 'text-green-400' : 'text-white'}`}>
                        ${payment.amount}
                      </p>
                      <p className="text-sm text-gray-400">
                        Balance: ${Math.max(0, runningBalance).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCreditCardPayment(payment.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* After Payoff Suggestions */}
      {isPaidOff && creditCard.totalAmount > 0 ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">
            Congratulations! Redirect Your ${creditCard.monthlyPayment}/month:
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-300">
              <ArrowRight className="w-4 h-4 text-green-400" />
              <span>+$150 to Emergency Fund = faster goal completion</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <ArrowRight className="w-4 h-4 text-green-400" />
              <span>+$80 to Brokerage = more wealth building</span>
            </div>
          </div>
        </div>
      ) : !isPaidOff && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">After Payoff Plan</h3>
          <p className="text-gray-300 text-sm">
            Once paid off, that ${creditCard.monthlyPayment}/month can be redirected to:
          </p>
          <ul className="text-gray-400 text-sm mt-2 space-y-1">
            <li>Emergency Fund - reach ${config.emergencyFundTarget.toLocaleString()} faster</li>
            <li>Brokerage - grow long-term wealth</li>
            <li>Or split between both!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
