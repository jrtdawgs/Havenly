'use client';

import { useState } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { Briefcase, Plus, AlertTriangle, Check, Trash2, Edit2, X, Calendar, GripVertical } from 'lucide-react';
import { WorkExpense } from '@/types/budget';

const CATEGORIES: WorkExpense['category'][] = ['Meals', 'Travel', 'Supplies', 'Other'];

const emptyExpense = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: 'Meals' as WorkExpense['category'],
  amount: '',
  hasReceipt: true,
  expectedReimbursementDate: '',
  dueDate: '',
};

export function WorkExpenseTracker() {
  const { state, addWorkExpense, updateWorkExpense, deleteWorkExpense, reorderWorkExpenses } = useBudget();
  const { config, workExpenses } = state;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyExpense);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const pendingExpenses = workExpenses.filter(e => e.status === 'Pending');
  const submittedExpenses = workExpenses.filter(e => e.status === 'Submitted');
  const activeExpenses = workExpenses.filter(e => e.status !== 'Reimbursed');
  const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSubmitted = submittedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFloat = totalPending + totalSubmitted;

  // Calculate expected reimbursements that will be back before their due dates
  // (money that will be back in time to cover the CC payment)
  const expectedBackBeforeDue = activeExpenses
    .filter(e =>
      e.expectedReimbursementDate &&
      e.dueDate &&
      e.expectedReimbursementDate <= e.dueDate
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const baseLimit = config.netPayPerPaycheck;
  const effectiveSafeLimit = baseLimit + expectedBackBeforeDue;
  const isOverLimit = totalFloat > effectiveSafeLimit;

  // Calculate float by due date
  const today = new Date();

  // Group expenses by due date and calculate what will be reimbursed before each due date
  const getFloatAnalysis = () => {
    const expensesWithDueDates = activeExpenses.filter(e => e.dueDate);
    const uniqueDueDates = [...new Set(expensesWithDueDates.map(e => e.dueDate))].sort();

    return uniqueDueDates.map(dueDate => {
      const dueExpenses = activeExpenses.filter(e => e.dueDate === dueDate);
      const dueDateTotal = dueExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Find expenses expected to be reimbursed before this due date
      const reimbursedBeforeDue = activeExpenses.filter(e =>
        e.expectedReimbursementDate &&
        e.expectedReimbursementDate <= dueDate!
      );
      const expectedBack = reimbursedBeforeDue.reduce((sum, e) => sum + e.amount, 0);

      const netExposure = dueDateTotal - expectedBack;
      const daysUntilDue = Math.ceil((new Date(dueDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        dueDate,
        dueDateTotal,
        expectedBack,
        netExposure,
        daysUntilDue,
        isCovered: expectedBack >= dueDateTotal,
      };
    });
  };

  const floatAnalysis = getFloatAnalysis();

  const handleAdd = () => {
    if (formData.description && formData.amount) {
      addWorkExpense({
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        hasReceipt: formData.hasReceipt,
        status: 'Pending',
        expectedReimbursementDate: formData.expectedReimbursementDate || undefined,
        dueDate: formData.dueDate || undefined,
      });
      setFormData(emptyExpense);
      setShowForm(false);
    }
  };

  const handleEdit = (expense: WorkExpense) => {
    setEditingId(expense.id);
    setFormData({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      hasReceipt: expense.hasReceipt,
      expectedReimbursementDate: expense.expectedReimbursementDate || '',
      dueDate: expense.dueDate || '',
    });
  };

  const handleSaveEdit = () => {
    if (editingId && formData.description && formData.amount) {
      updateWorkExpense(editingId, {
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        hasReceipt: formData.hasReceipt,
        expectedReimbursementDate: formData.expectedReimbursementDate || undefined,
        dueDate: formData.dueDate || undefined,
      });
      setEditingId(null);
      setFormData(emptyExpense);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyExpense);
  };

  const handleStatusChange = (id: string, status: WorkExpense['status']) => {
    updateWorkExpense(id, { status });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderWorkExpenses(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white";

  return (
    <div className="space-y-6">
      {/* Float Summary */}
      <div className={`rounded-xl border p-6 ${
        isOverLimit
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-blue-500/10 border-blue-500/30'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {isOverLimit ? (
            <AlertTriangle className="w-6 h-6 text-red-400" />
          ) : (
            <Briefcase className="w-6 h-6 text-blue-400" />
          )}
          <h2 className="text-xl font-bold text-white">Work Expense Float</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400">Total Float</p>
            <p className={`text-2xl font-bold ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
              ${totalFloat.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">${totalPending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Submitted</p>
            <p className="text-2xl font-bold text-blue-400">${totalSubmitted.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Base Limit</p>
            <p className="text-2xl font-bold text-gray-400">${baseLimit.toFixed(2)}</p>
            <p className="text-xs text-gray-500">1 paycheck</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Effective Limit</p>
            <p className="text-2xl font-bold text-green-400">${effectiveSafeLimit.toFixed(2)}</p>
            <p className="text-xs text-gray-500">+${expectedBackBeforeDue.toFixed(2)} back before due</p>
          </div>
        </div>

        {/* Float Capacity Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${effectiveSafeLimit > 0 ? Math.min((totalFloat / effectiveSafeLimit) * 100, 100) : 0}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {isOverLimit
            ? `Over effective limit by $${(totalFloat - effectiveSafeLimit).toFixed(2)} - delay discretionary spending!`
            : `$${(effectiveSafeLimit - totalFloat).toFixed(2)} remaining capacity${expectedBackBeforeDue > 0 ? ' (includes reimbursements due back in time)' : ''}`}
        </p>
      </div>

      {/* Float Analysis by Due Date */}
      {floatAnalysis.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Float by Due Date</h3>
          </div>

          <div className="space-y-3">
            {floatAnalysis.map(({ dueDate, dueDateTotal, expectedBack, netExposure, daysUntilDue, isCovered }) => (
              <div
                key={dueDate}
                className={`p-4 rounded-lg border ${
                  isCovered
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">Due: {dueDate}</p>
                    <p className="text-sm text-gray-400">
                      {daysUntilDue > 0 ? `${daysUntilDue} days away` : daysUntilDue === 0 ? 'Today!' : 'Past due'}
                    </p>
                  </div>
                  <div className="text-right">
                    {isCovered ? (
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" /> Covered
                      </span>
                    ) : (
                      <span className="text-yellow-400 text-sm">
                        ${netExposure.toFixed(2)} exposure
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Due</p>
                    <p className="text-white">${dueDateTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expected Back</p>
                    <p className="text-green-400">${expectedBack.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Net</p>
                    <p className={netExposure > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      ${netExposure.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Button */}
      {!showForm && !editingId && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Work Expense
        </button>
      )}

      {/* Add/Edit Expense Form */}
      {(showForm || editingId) && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Expense' : 'Add Expense'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expense Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as WorkExpense['category'] })}
                className={inputClass}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass}
                placeholder="Client lunch, Uber to site, etc."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Reimbursement</label>
              <input
                type="date"
                value={formData.expectedReimbursementDate}
                onChange={(e) => setFormData({ ...formData, expectedReimbursementDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Due Date (CC payment date)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasReceipt"
                checked={formData.hasReceipt}
                onChange={(e) => setFormData({ ...formData, hasReceipt: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="hasReceipt" className="text-sm text-gray-400">
                Have receipt?
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingId ? handleSaveEdit : handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Add Expense'}
            </button>
            <button
              onClick={editingId ? handleCancelEdit : () => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expense List */}
      {workExpenses.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Expense Log</h3>

          <div className="space-y-3">
            {workExpenses.map((expense, index) => (
              <div
                key={expense.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={`p-4 rounded-lg border transition-all ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                    ? 'border-blue-400 border-2'
                    : ''
                } ${
                  expense.status === 'Reimbursed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : expense.status === 'Submitted'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 mt-1">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{expense.description}</p>
                    <p className="text-sm text-gray-400">
                      {expense.date} • {expense.category}
                      {!expense.hasReceipt && ' • No receipt'}
                    </p>
                    {expense.expectedReimbursementDate && expense.status !== 'Reimbursed' && (
                      <p className="text-sm text-green-400">
                        Expected back: {expense.expectedReimbursementDate}
                      </p>
                    )}
                    {expense.dueDate && expense.status !== 'Reimbursed' && (
                      <p className="text-sm text-purple-400">
                        Due: {expense.dueDate}
                      </p>
                    )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-white">${expense.amount.toFixed(2)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={expense.status}
                        onChange={(e) => handleStatusChange(expense.id, e.target.value as WorkExpense['status'])}
                        className={`text-xs rounded px-2 py-1 ${
                          expense.status === 'Reimbursed'
                            ? 'bg-green-600'
                            : expense.status === 'Submitted'
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                        } text-white`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Reimbursed">Reimbursed</option>
                      </select>

                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-gray-400 hover:text-blue-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteWorkExpense(expense.id)}
                        className="text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
