export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'promptpay' | 'e_wallet';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  note?: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: Record<string, number>; // categoryId -> budgetAmount
}

export interface UserFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  collectionName?: string;
  isEnabled: boolean;
}

export interface FilterState {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  paymentMethod: 'all' | PaymentMethod;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}
