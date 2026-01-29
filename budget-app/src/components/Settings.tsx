'use client';

import { useBudget } from '@/context/BudgetContext';
import { Settings as SettingsIcon, RefreshCw, Save, Check, Download, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BudgetConfig } from '@/types/budget';

export function Settings() {
  const { state, updateConfig, updateCreditCard, updateSavingsFund, resetState } = useBudget();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current fund contributions from savingsFunds
  const emergencyFund = state.savingsFunds.find(f => f.id === 'emergency');
  const vacationFund = state.savingsFunds.find(f => f.id === 'vacation');

  // Local form state - changes here don't affect the app until saved
  const [formValues, setFormValues] = useState<BudgetConfig>({
    ...state.config,
    emergencyFundMonthly: emergencyFund?.monthlyContribution || state.config.emergencyFundMonthly,
    brokerageMonthly: vacationFund?.monthlyContribution || state.config.brokerageMonthly,
  });
  const [ccPayment, setCcPayment] = useState(state.creditCard.monthlyPayment);

  // Update form values when state changes (e.g., after reset or fund edits)
  useEffect(() => {
    const emergency = state.savingsFunds.find(f => f.id === 'emergency');
    const vacation = state.savingsFunds.find(f => f.id === 'vacation');
    setFormValues({
      ...state.config,
      emergencyFundMonthly: emergency?.monthlyContribution || state.config.emergencyFundMonthly,
      brokerageMonthly: vacation?.monthlyContribution || state.config.brokerageMonthly,
    });
    setCcPayment(state.creditCard.monthlyPayment);
    setHasChanges(false);
  }, [state.config, state.creditCard.monthlyPayment, state.savingsFunds]);

  const handleChange = (key: keyof BudgetConfig, value: number) => {
    setFormValues(prev => ({ ...prev, [key]: isNaN(value) ? 0 : value }));
    setHasChanges(true);
    setShowSaved(false);
  };

  const handleCcPaymentChange = (value: number) => {
    setCcPayment(isNaN(value) ? 0 : value);
    setHasChanges(true);
    setShowSaved(false);
  };

  const handleSave = () => {
    updateConfig(formValues);
    updateCreditCard({ monthlyPayment: ccPayment });
    // Sync savings fund contributions with config values
    updateSavingsFund('emergency', { monthlyContribution: formValues.emergencyFundMonthly });
    updateSavingsFund('vacation', { monthlyContribution: formValues.brokerageMonthly });
    setHasChanges(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleDiscard = () => {
    setFormValues(state.config);
    setCcPayment(state.creditCard.monthlyPayment);
    setHasChanges(false);
  };

  const handleExport = () => {
    const data = localStorage.getItem('budget-master-state');
    if (!data) {
      alert('No data to export');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `havenly-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        JSON.parse(data); // Validate JSON
        localStorage.setItem('budget-master-state', data);
        setImportStatus('success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const inputClass = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white";

  // Calculate summary using form values (preview what will be saved)
  const monthlyNet = formValues.netPayPerPaycheck * 2; // Semi-monthly (2x per month)
  const fixedExpenses = formValues.rent + formValues.power + formValues.internet +
    formValues.gas + formValues.groceries + formValues.gym + formValues.funMoneyMonthly + ccPayment;
  const savingsAllocations = formValues.rothIraMonthly + formValues.emergencyFundMonthly +
    formValues.brokerageMonthly;
  const buffer = monthlyNet - fixedExpenses - savingsAllocations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-bold text-white">Budget Settings</h2>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleDiscard}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
              hasChanges
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {showSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-sm">You have unsaved changes</span>
        </div>
      )}

      {/* Income */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Income</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Annual Salary</label>
            <input
              type="number"
              value={formValues.annualSalary}
              onChange={(e) => handleChange('annualSalary', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Net Pay Per Paycheck</label>
            <input
              type="number"
              value={formValues.netPayPerPaycheck}
              onChange={(e) => handleChange('netPayPerPaycheck', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Auto Deductions */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Paycheck Deductions (Pre-Tax)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Roth 401k / Paycheck</label>
            <input
              type="number"
              value={formValues.roth401kPerPaycheck}
              onChange={(e) => handleChange('roth401kPerPaycheck', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">HSA / Paycheck</label>
            <input
              type="number"
              value={formValues.hsaPerPaycheck}
              onChange={(e) => handleChange('hsaPerPaycheck', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Employer Match %</label>
            <input
              type="number"
              value={formValues.employerMatchPercent}
              onChange={(e) => handleChange('employerMatchPercent', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Fixed Expenses */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Fixed Monthly Expenses</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rent</label>
            <input
              type="number"
              value={formValues.rent}
              onChange={(e) => handleChange('rent', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Power</label>
            <input
              type="number"
              value={formValues.power}
              onChange={(e) => handleChange('power', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Internet</label>
            <input
              type="number"
              value={formValues.internet}
              onChange={(e) => handleChange('internet', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gas</label>
            <input
              type="number"
              value={formValues.gas}
              onChange={(e) => handleChange('gas', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Groceries</label>
            <input
              type="number"
              value={formValues.groceries}
              onChange={(e) => handleChange('groceries', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gym</label>
            <input
              type="number"
              value={formValues.gym}
              onChange={(e) => handleChange('gym', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">CC Payment</label>
            <input
              type="number"
              value={ccPayment}
              onChange={(e) => handleCcPaymentChange(e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fun Money</label>
            <input
              type="number"
              value={formValues.funMoneyMonthly}
              onChange={(e) => handleChange('funMoneyMonthly', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Savings Allocations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Roth IRA</label>
            <input
              type="number"
              value={formValues.rothIraMonthly}
              onChange={(e) => handleChange('rothIraMonthly', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emergency Fund</label>
            <input
              type="number"
              value={formValues.emergencyFundMonthly}
              onChange={(e) => handleChange('emergencyFundMonthly', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Vacation Fund</label>
            <input
              type="number"
              value={formValues.brokerageMonthly}
              onChange={(e) => handleChange('brokerageMonthly', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Targets */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emergency Fund Target</label>
            <input
              type="number"
              value={formValues.emergencyFundTarget}
              onChange={(e) => handleChange('emergencyFundTarget', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Roth IRA Annual Limit</label>
            <input
              type="number"
              value={formValues.rothIraAnnualLimit}
              onChange={(e) => handleChange('rothIraAnnualLimit', e.target.valueAsNumber)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      <div className={`rounded-xl p-6 ${hasChanges ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${hasChanges ? 'text-yellow-400' : 'text-blue-400'}`}>
          Budget Summary {hasChanges && '(Preview)'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Monthly Net</p>
            <p className="text-white font-semibold">
              ${monthlyNet.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Fixed Expenses</p>
            <p className="text-white font-semibold">
              ${fixedExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Savings Allocations</p>
            <p className="text-white font-semibold">
              ${savingsAllocations.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Buffer</p>
            <p className={`font-semibold ${buffer >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${buffer.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Data Management</h3>
        <p className="text-gray-400 text-sm mb-4">
          Export your data to transfer between devices or create a backup.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {importStatus === 'success' && (
          <p className="text-green-400 text-sm mt-3">Data imported successfully! Reloading...</p>
        )}
        {importStatus === 'error' && (
          <p className="text-red-400 text-sm mt-3">Invalid file format. Please use a valid backup file.</p>
        )}
      </div>

      {/* Reset */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-gray-400 text-sm mb-4">
          Reset all data to defaults. This cannot be undone.
        </p>
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset All Data
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetState();
                setShowConfirmReset(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Yes, Reset Everything
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Save className="w-4 h-4" />
        <span>Click "Save Changes" to apply your updates across the app</span>
      </div>
    </div>
  );
}
