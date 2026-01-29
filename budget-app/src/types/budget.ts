export interface BudgetConfig {
  // Income
  annualSalary: number;
  netPayPerPaycheck: number;

  // Paycheck deductions (already taken out)
  roth401kPerPaycheck: number;
  hsaPerPaycheck: number;

  // Employer contributions (free money)
  employerMatchPercent: number;

  // Fixed expenses
  rent: number;
  power: number;
  internet: number;
  gas: number;
  groceries: number;
  gym: number;

  // Goals
  rothIraMonthly: number;
  emergencyFundMonthly: number;
  brokerageMonthly: number;
  funMoneyMonthly: number;

  // Targets
  emergencyFundTarget: number;
  rothIraAnnualLimit: number;
}

export interface CreditCardDebt {
  totalAmount: number;
  monthlyPayment: number;
  payments: CreditCardPayment[];
}

export interface CreditCardPayment {
  id: string;
  month: number;
  amount: number;
  paid: boolean;
  datePaid?: string;
}

export interface WorkExpense {
  id: string;
  date: string;
  description: string;
  category: 'Meals' | 'Travel' | 'Supplies' | 'Other';
  amount: number;
  hasReceipt: boolean;
  status: 'Pending' | 'Submitted' | 'Reimbursed';
  expectedReimbursementDate?: string;
  dueDate?: string; // When this expense needs to be covered (e.g., CC due date)
}

export interface RothIRAContribution {
  id: string;
  month: string;
  amount: number;
  date?: string;
}

export interface EmergencyFundEntry {
  id: string;
  month: string;
  amount: number;
  date?: string;
}

export interface SavingsFund {
  id: string;
  name: string;
  balance: number;
  target: number;
  monthlyContribution: number;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'pink';
  isActive: boolean;
}

export interface FundTransaction {
  id: string;
  fundId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  date: string;
  note?: string;
}

export interface PaycheckEntry {
  id: string;
  payDate: string;
  gross: number;
  net: number;
  hours: number;
  rothIra: number;
  emergencyFund: number;
  brokerage: number;
  notes: string;
}

export type BudgetCategory = 'rent' | 'power' | 'internet' | 'gas' | 'groceries' | 'gym' | 'creditCard' | 'funMoney' | 'other' | string;

export interface BudgetTransaction {
  id: string;
  date: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  month: string; // e.g., "2025-01" for tracking monthly spending
}

export interface CustomCategory {
  id: string;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange';
  budget: number;
}

export interface MonthlyBudgetOverride {
  month: string; // e.g., "2025-01"
  totalBudget: number;
  categoryOverrides?: Record<string, number>; // category id -> budget amount
}

export interface BudgetState {
  config: BudgetConfig;
  creditCard: CreditCardDebt;
  workExpenses: WorkExpense[];
  rothIraContributions: RothIRAContribution[];
  emergencyFundEntries: EmergencyFundEntry[];
  emergencyFundBalance: number;
  savingsFunds: SavingsFund[];
  fundTransactions: FundTransaction[];
  paychecks: PaycheckEntry[];
  budgetTransactions: BudgetTransaction[];
  customCategories: CustomCategory[];
  monthlyBudgetOverrides: MonthlyBudgetOverride[];
}

export const DEFAULT_CONFIG: BudgetConfig = {
  annualSalary: 76000,
  netPayPerPaycheck: 1920,
  roth401kPerPaycheck: 253.33,
  hsaPerPaycheck: 126.67,
  employerMatchPercent: 8,
  rent: 1815,
  power: 120,
  internet: 51.16,
  gas: 48.30,
  groceries: 140,
  gym: 34.99,
  rothIraMonthly: 443.34,
  emergencyFundMonthly: 1000,
  brokerageMonthly: 100,
  funMoneyMonthly: 40,
  emergencyFundTarget: 15000,
  rothIraAnnualLimit: 7500,
};

export const DEFAULT_FUNDS: SavingsFund[] = [
  { id: 'emergency', name: 'Emergency Fund', balance: 6733.26, target: 15000, monthlyContribution: 320, color: 'green', isActive: true },
  { id: 'vacation', name: 'Vacation Fund', balance: 626, target: 5000, monthlyContribution: 320, color: 'blue', isActive: true },
  { id: 'house', name: 'House Fund', balance: 1, target: 50000, monthlyContribution: 0, color: 'purple', isActive: false },
  { id: 'car', name: 'Car Fund', balance: 1, target: 10000, monthlyContribution: 0, color: 'yellow', isActive: false },
];

export const DEFAULT_STATE: BudgetState = {
  config: DEFAULT_CONFIG,
  creditCard: {
    totalAmount: 948.24,
    monthlyPayment: 158.04,
    payments: [
      { id: '1', month: 1, amount: 158.04, paid: false },
      { id: '2', month: 2, amount: 158.04, paid: false },
      { id: '3', month: 3, amount: 158.04, paid: false },
      { id: '4', month: 4, amount: 158.04, paid: false },
      { id: '5', month: 5, amount: 158.04, paid: false },
      { id: '6', month: 6, amount: 158.04, paid: false },
    ],
  },
  workExpenses: [],
  rothIraContributions: [],
  emergencyFundEntries: [],
  emergencyFundBalance: 6733.26,
  savingsFunds: DEFAULT_FUNDS,
  fundTransactions: [],
  paychecks: [],
  budgetTransactions: [],
  customCategories: [],
  monthlyBudgetOverrides: [],
};
