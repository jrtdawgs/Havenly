'use client';

import { useState, useRef, useEffect } from 'react';
import { useBudget } from '@/context/BudgetContext';
import { BudgetCategory, CustomCategory } from '@/types/budget';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Receipt,
  Plus,
  Trash2,
  Home,
  Zap,
  Wifi,
  Fuel,
  ShoppingCart,
  PartyPopper,
  MoreHorizontal,
  Dumbbell,
  CreditCard,
  Edit2,
  Check,
  X,
  Tag,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

interface CategoryConfig {
  id: BudgetCategory;
  label: string;
  icon: typeof Home;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  iconClass: string;
  bgClass: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'rent', label: 'Rent', icon: Home, color: 'blue', iconClass: 'text-blue-400', bgClass: 'bg-blue-500/20' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'green', iconClass: 'text-green-400', bgClass: 'bg-green-500/20' },
  { id: 'power', label: 'Power', icon: Zap, color: 'yellow', iconClass: 'text-yellow-400', bgClass: 'bg-yellow-500/20' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: 'purple', iconClass: 'text-purple-400', bgClass: 'bg-purple-500/20' },
  { id: 'gas', label: 'Gas', icon: Fuel, color: 'yellow', iconClass: 'text-orange-400', bgClass: 'bg-orange-500/20' },
  { id: 'funMoney', label: 'Fun Money', icon: PartyPopper, color: 'purple', iconClass: 'text-pink-400', bgClass: 'bg-pink-500/20' },
  { id: 'gym', label: 'Gym', icon: Dumbbell, color: 'red', iconClass: 'text-red-400', bgClass: 'bg-red-500/20' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, color: 'blue', iconClass: 'text-gray-400', bgClass: 'bg-gray-500/20' },
  { id: 'creditCard', label: 'CC Payment', icon: CreditCard, color: 'yellow', iconClass: 'text-yellow-400', bgClass: 'bg-yellow-500/20' },
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const CUSTOM_COLOR_CLASSES: Record<CustomCategory['color'], { iconClass: string; bgClass: string }> = {
  blue: { iconClass: 'text-blue-400', bgClass: 'bg-blue-500/20' },
  green: { iconClass: 'text-green-400', bgClass: 'bg-green-500/20' },
  yellow: { iconClass: 'text-yellow-400', bgClass: 'bg-yellow-500/20' },
  red: { iconClass: 'text-red-400', bgClass: 'bg-red-500/20' },
  purple: { iconClass: 'text-purple-400', bgClass: 'bg-purple-500/20' },
  pink: { iconClass: 'text-pink-400', bgClass: 'bg-pink-500/20' },
  orange: { iconClass: 'text-orange-400', bgClass: 'bg-orange-500/20' },
};

export function BudgetTracker() {
  const {
    state,
    addBudgetTransaction,
    deleteBudgetTransaction,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    setMonthlyBudgetOverride,
    deleteMonthlyBudgetOverride,
  } = useBudget();
  const { config, creditCard, budgetTransactions, customCategories, monthlyBudgetOverrides } = state;

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);

  // Close month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'groceries' as BudgetCategory,
    amount: '',
  });

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState('');

  // Custom category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    label: '',
    color: 'blue' as CustomCategory['color'],
    budget: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryData, setEditCategoryData] = useState({ label: '', budget: '' });

  // Quick add transaction for specific category
  const [quickAddCategory, setQuickAddCategory] = useState<BudgetCategory | null>(null);
  const [quickAddData, setQuickAddData] = useState({ description: '', amount: '' });

  // Get budget amounts for each category
  const getBudgetAmount = (category: BudgetCategory): number => {
    // Check if it's a custom category
    const customCat = customCategories.find(c => c.id === category);
    if (customCat) return customCat.budget;

    switch (category) {
      case 'rent': return config.rent;
      case 'power': return config.power;
      case 'internet': return config.internet;
      case 'gas': return config.gas;
      case 'groceries': return config.groceries;
      case 'gym': return config.gym;
      case 'creditCard': return creditCard.monthlyPayment;
      case 'funMoney': return config.funMoneyMonthly;
      case 'other': return 0;
      default: return 0;
    }
  };

  // Get spent amount for a category in selected month
  const getSpentAmount = (category: BudgetCategory): number => {
    return budgetTransactions
      .filter(t => t.category === category && t.month === selectedMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Get transactions for selected month
  const monthTransactions = budgetTransactions
    .filter(t => t.month === selectedMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const baseBudget = config.rent + config.power + config.internet + config.gas + config.groceries + config.gym + creditCard.monthlyPayment + config.funMoneyMonthly;
  const customCategoryBudget = customCategories.reduce((sum, c) => sum + c.budget, 0);
  const defaultTotalBudget = baseBudget + customCategoryBudget;

  // Check for monthly override
  const monthOverride = monthlyBudgetOverrides.find(o => o.month === selectedMonth);
  const totalBudget = monthOverride ? monthOverride.totalBudget : defaultTotalBudget;
  const hasOverride = !!monthOverride;

  const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Budget editing handlers
  const handleStartEditBudget = () => {
    setEditBudgetAmount(totalBudget.toString());
    setIsEditingBudget(true);
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(editBudgetAmount);
    if (!isNaN(amount) && amount > 0) {
      setMonthlyBudgetOverride(selectedMonth, amount);
    }
    setIsEditingBudget(false);
  };

  const handleResetBudget = () => {
    deleteMonthlyBudgetOverride(selectedMonth);
    setIsEditingBudget(false);
  };

  // Custom category handlers
  const handleAddCategory = () => {
    if (newCategory.label && newCategory.budget) {
      addCustomCategory({
        label: newCategory.label,
        color: newCategory.color,
        budget: parseFloat(newCategory.budget) || 0,
      });
      setNewCategory({ label: '', color: 'blue', budget: '' });
      setShowAddCategory(false);
    }
  };

  const handleStartEditCategory = (cat: CustomCategory) => {
    setEditingCategoryId(cat.id);
    setEditCategoryData({ label: cat.label, budget: cat.budget.toString() });
  };

  const handleSaveCategory = (id: string) => {
    updateCustomCategory(id, {
      label: editCategoryData.label,
      budget: parseFloat(editCategoryData.budget) || 0,
    });
    setEditingCategoryId(null);
  };

  // Quick add transaction handler
  const handleQuickAdd = (category: BudgetCategory) => {
    if (quickAddData.amount) {
      // Use selected month, default to today's date if current month, otherwise first of month
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.slice(0, 7);
      const transactionDate = selectedMonth === currentMonth ? today : `${selectedMonth}-01`;
      addBudgetTransaction({
        date: transactionDate,
        description: quickAddData.description,
        category,
        amount: parseFloat(quickAddData.amount),
        month: selectedMonth,
      });
      setQuickAddData({ description: '', amount: '' });
      setQuickAddCategory(null);
    }
  };

  const handleAdd = () => {
    if (formData.amount) {
      addBudgetTransaction({
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        month: formData.date.slice(0, 7),
      });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'groceries',
        amount: '',
      });
      setShowForm(false);
    }
  };

  const getCategoryConfig = (category: BudgetCategory): CategoryConfig => {
    // Check built-in categories first
    const builtIn = CATEGORIES.find(c => c.id === category);
    if (builtIn) return builtIn;

    // Check custom categories
    const customCat = customCategories.find(c => c.id === category);
    if (customCat) {
      const colorClasses = CUSTOM_COLOR_CLASSES[customCat.color];
      return {
        id: customCat.id,
        label: customCat.label,
        icon: Tag,
        color: customCat.color === 'red' ? 'red' : customCat.color === 'green' ? 'green' : customCat.color === 'yellow' ? 'yellow' : customCat.color === 'purple' ? 'purple' : 'blue',
        iconClass: colorClasses.iconClass,
        bgClass: colorClasses.bgClass,
      };
    }

    return CATEGORIES[CATEGORIES.length - 1]; // Default to 'other'
  };

  return (
    <div className="space-y-6">
      {/* Month Selector & Summary */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Monthly Budget</h2>
          </div>
          <div className="relative" ref={monthPickerRef}>
            <button
              onClick={() => {
                setShowMonthPicker(!showMonthPicker);
                setPickerYear(parseInt(selectedMonth.split('-')[0]));
              }}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex items-center gap-2 hover:bg-gray-600"
            >
              <Calendar className="w-4 h-4" />
              {getMonthLabel(selectedMonth)}
            </button>

            {showMonthPicker && (
              <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50 w-64">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear(pickerYear - 1)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <span className="text-white font-semibold">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear(pickerYear + 1)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => {
                    const monthValue = `${pickerYear}-${String(index + 1).padStart(2, '0')}`;
                    const isSelected = monthValue === selectedMonth;
                    const isCurrentMonth = monthValue === getCurrentMonth();

                    return (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(monthValue);
                          setShowMonthPicker(false);
                        }}
                        className={`px-2 py-2 rounded text-sm transition-colors ${
                          isSelected
                            ? 'bg-green-600 text-white'
                            : isCurrentMonth
                            ? 'bg-gray-600 text-white ring-1 ring-green-500'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setSelectedMonth(getCurrentMonth());
                      setShowMonthPicker(false);
                    }}
                    className="w-full text-sm text-green-400 hover:text-green-300"
                  >
                    Go to Current Month
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Total Spent</span>
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">${totalSpent.toFixed(2)} /</span>
                <input
                  type="number"
                  value={editBudgetAmount}
                  onChange={(e) => setEditBudgetAmount(e.target.value)}
                  className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveBudget}
                  className="text-green-400 hover:text-green-300"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingBudget(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={totalRemaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
                </span>
                <button
                  onClick={handleStartEditBudget}
                  className="text-gray-500 hover:text-white"
                  title="Edit monthly budget"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {hasOverride && (
                  <span className="text-xs text-yellow-400">(custom)</span>
                )}
              </div>
            )}
          </div>
          <ProgressBar
            current={totalSpent}
            target={totalBudget}
            color={totalRemaining >= 0 ? 'green' : 'red'}
            size="md"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm">
              {totalRemaining >= 0 ? (
                <span className="text-green-400">${totalRemaining.toFixed(2)} remaining</span>
              ) : (
                <span className="text-red-400">${Math.abs(totalRemaining).toFixed(2)} over budget</span>
              )}
            </p>
            {hasOverride && (
              <button
                onClick={handleResetBudget}
                className="text-xs text-gray-500 hover:text-yellow-400"
              >
                Reset to default (${defaultTotalBudget.toFixed(2)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
          <button
            onClick={() => setShowAddCategory(true)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCategory && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-white mb-3">New Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newCategory.label}
                  onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Monthly Budget</label>
                <input
                  type="number"
                  value={newCategory.budget}
                  onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Color</label>
                <select
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value as CustomCategory['color'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Built-in categories */}
          {CATEGORIES.filter(c => c.id !== 'other').map(({ id, label, icon: Icon, color, iconClass }) => {
            const budget = getBudgetAmount(id);
            const spent = getSpentAmount(id);
            const remaining = budget - spent;
            const isOver = remaining < 0;
            const isQuickAdding = quickAddCategory === id;

            return (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                    <span className="text-gray-300">{label}</span>
                    <button
                      onClick={() => setQuickAddCategory(isQuickAdding ? null : id)}
                      className="text-gray-500 hover:text-green-400"
                      title={`Add ${label} transaction`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className={isOver ? 'text-red-400' : 'text-white'}>
                      ${spent.toFixed(2)}
                    </span>
                    <span className="text-gray-500"> / ${budget.toFixed(2)}</span>
                  </div>
                </div>
                {isQuickAdding && (
                  <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded mt-1">
                    <input
                      type="text"
                      value={quickAddData.description}
                      onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="Description"
                      autoFocus
                    />
                    <input
                      type="number"
                      value={quickAddData.amount}
                      onChange={(e) => setQuickAddData({ ...quickAddData, amount: e.target.value })}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="$0.00"
                      step="0.01"
                    />
                    <button
                      onClick={() => handleQuickAdd(id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setQuickAddCategory(null); setQuickAddData({ description: '', amount: '' }); }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <ProgressBar
                  current={spent}
                  target={budget > 0 ? budget : 1}
                  color={isOver ? 'red' : 'green'}
                  size="sm"
                />
                {spent > 0 && (
                  <p className="text-xs text-right">
                    {isOver ? (
                      <span className="text-red-400">${Math.abs(remaining).toFixed(2)} over</span>
                    ) : (
                      <span className="text-gray-500">${remaining.toFixed(2)} left</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}

          {/* Custom categories */}
          {customCategories.map((cat) => {
            const spent = getSpentAmount(cat.id);
            const remaining = cat.budget - spent;
            const isOver = remaining < 0;
            const colorClasses = CUSTOM_COLOR_CLASSES[cat.color];
            const isEditing = editingCategoryId === cat.id;
            const isQuickAdding = quickAddCategory === cat.id;

            return (
              <div key={cat.id} className="space-y-1">
                {isEditing ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                    <Tag className={`w-4 h-4 ${colorClasses.iconClass}`} />
                    <input
                      type="text"
                      value={editCategoryData.label}
                      onChange={(e) => setEditCategoryData({ ...editCategoryData, label: e.target.value })}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      value={editCategoryData.budget}
                      onChange={(e) => setEditCategoryData({ ...editCategoryData, budget: e.target.value })}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                    <button
                      onClick={() => handleSaveCategory(cat.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className={`w-4 h-4 ${colorClasses.iconClass}`} />
                        <span className="text-gray-300">{cat.label}</span>
                        <button
                          onClick={() => setQuickAddCategory(isQuickAdding ? null : cat.id)}
                          className="text-gray-500 hover:text-green-400"
                          title={`Add ${cat.label} transaction`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStartEditCategory(cat)}
                          className="text-gray-500 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteCustomCategory(cat.id)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className={isOver ? 'text-red-400' : 'text-white'}>
                          ${spent.toFixed(2)}
                        </span>
                        <span className="text-gray-500"> / ${cat.budget.toFixed(2)}</span>
                      </div>
                    </div>
                    {isQuickAdding && (
                      <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded mt-1">
                        <input
                          type="text"
                          value={quickAddData.description}
                          onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          placeholder="Description"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={quickAddData.amount}
                          onChange={(e) => setQuickAddData({ ...quickAddData, amount: e.target.value })}
                          className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          placeholder="$0.00"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleQuickAdd(cat.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setQuickAddCategory(null); setQuickAddData({ description: '', amount: '' }); }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <ProgressBar
                      current={spent}
                      target={cat.budget > 0 ? cat.budget : 1}
                      color={isOver ? 'red' : 'green'}
                      size="sm"
                    />
                    {spent > 0 && (
                      <p className="text-xs text-right">
                        {isOver ? (
                          <span className="text-red-400">${Math.abs(remaining).toFixed(2)} over</span>
                        ) : (
                          <span className="text-gray-500">${remaining.toFixed(2)} left</span>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Other category (no budget) */}
          {getSpentAmount('other') > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Other</span>
                </div>
                <span className="text-white">${getSpentAmount('other').toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      )}

      {/* Add Transaction Form */}
      {showForm && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add Transaction</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BudgetCategory })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
                {customCategories.length > 0 && (
                  <optgroup label="Custom Categories">
                    {customCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="What did you spend on?"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {monthTransactions.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Transactions ({getMonthLabel(selectedMonth)})
          </h3>

          <div className="space-y-2">
            {monthTransactions.map((transaction) => {
              const catConfig = getCategoryConfig(transaction.category);
              const Icon = catConfig.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${catConfig.bgClass}`}>
                      <Icon className={`w-4 h-4 ${catConfig.iconClass}`} />
                    </div>
                    <div>
                      <p className="text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.date} • {catConfig.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-semibold">
                      -${transaction.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteBudgetTransaction(transaction.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {monthTransactions.length === 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
          <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No transactions for {getMonthLabel(selectedMonth)}</p>
          <p className="text-sm text-gray-500 mt-1">Add your first transaction to start tracking</p>
        </div>
      )}
    </div>
  );
}
