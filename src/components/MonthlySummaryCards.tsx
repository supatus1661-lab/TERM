import React from 'react';
import { Transaction, MonthlyBudget } from '../types/finance';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
  budget?: MonthlyBudget;
  onOpenBudgetModal: () => void;
}

export const MonthlySummaryCards: React.FC<Props> = ({
  transactions,
  currentMonth,
  budget,
  onOpenBudgetModal,
}) => {
  // Current month transactions
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Savings rate
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  // Days in month calculation for daily average
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Calculate elapsed days in the selected month
  const now = new Date();
  const isCurrentMonthNow =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  const elapsedDays = isCurrentMonthNow ? Math.max(1, now.getDate()) : daysInMonth;

  const averageDailySpend = totalExpense / elapsedDays;

  // Budget calculations
  const totalBudget = budget?.totalBudget || 0;
  const budgetUsagePercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;
  const budgetRemaining = totalBudget - totalExpense;
  const isOverBudget = totalBudget > 0 && totalExpense > totalBudget;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: TOTAL INCOME */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            รายรับทั้งหมด
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          +฿{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold">
            {currentMonthTxs.filter((t) => t.type === 'income').length} รายการ
          </span>
          <span>·</span>
          <span>อัตราการออม {savingsRate.toFixed(1)}%</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none" />
      </div>

      {/* CARD 2: TOTAL EXPENSE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-rose-200 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            รายจ่ายทั้งหมด
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          -฿{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span className="text-rose-600 font-semibold">
            {currentMonthTxs.filter((t) => t.type === 'expense').length} รายการ
          </span>
          <span>·</span>
          <span>เฉลี่ย ฿{Math.round(averageDailySpend).toLocaleString()}/วัน</span>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-rose-500/5 rounded-full pointer-events-none" />
      </div>

      {/* CARD 3: NET BALANCE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-200 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ยอดคงเหลือสุทธิ
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              netBalance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {netBalance >= 0 ? <PiggyBank className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
        </div>
        <div
          className={`text-2xl font-bold tracking-tight ${
            netBalance >= 0 ? 'text-indigo-700' : 'text-rose-600'
          }`}
        >
          {netBalance >= 0 ? '+' : ''}฿
          {netBalance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          {netBalance >= 0 ? (
            <span className="text-indigo-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> กระแสเงินสดเป็นบวก
            </span>
          ) : (
            <span className="text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> รายจ่ายมากกว่ารายรับ
            </span>
          )}
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full pointer-events-none" />
      </div>

      {/* CARD 4: BUDGET & TARGET */}
      <div
        onClick={onOpenBudgetModal}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-400 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            งบประมาณรายเดือน
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {totalBudget > 0 ? (
          <>
            <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-baseline justify-between">
              <span>฿{totalBudget.toLocaleString()}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  isOverBudget
                    ? 'bg-rose-100 text-rose-700'
                    : budgetUsagePercent > 85
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {budgetUsagePercent.toFixed(0)}%
              </span>
            </div>

            {/* Mini progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : budgetUsagePercent > 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400">
                {isOverBudget ? 'เกินงบไป' : 'คงเหลืองบ'}
              </span>
              <span
                className={`font-semibold ${
                  isOverBudget ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                ฿{Math.abs(budgetRemaining).toLocaleString()}
              </span>
            </div>
          </>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs font-semibold text-indigo-600 group-hover:underline">
              + ตั้งงบประมาณเดือนนี้
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              กำหนดวงเงินเพื่อควบคุมการใช้จ่าย
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
