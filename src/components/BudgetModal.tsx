import React, { useState, useEffect } from 'react';
import { MonthlyBudget, Category, Transaction } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { X, Wallet, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string; // YYYY-MM
  budget?: MonthlyBudget;
  onSaveBudget: (budget: MonthlyBudget) => void;
  categories: Category[];
  transactions: Transaction[];
}

export const BudgetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentMonth,
  budget,
  onSaveBudget,
  categories,
  transactions,
}) => {
  const [totalBudgetStr, setTotalBudgetStr] = useState<string>('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate actual spending for each category in current month
  const actualCategorySpends = React.useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(currentMonth) && t.type === 'expense')
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [transactions, currentMonth]);

  useEffect(() => {
    if (budget) {
      setTotalBudgetStr(budget.totalBudget ? String(budget.totalBudget) : '');
      setCategoryBudgets(budget.categoryBudgets || {});
    } else {
      setTotalBudgetStr('30000');
      setCategoryBudgets({
        exp_food: 10000,
        exp_transport: 4000,
        exp_housing: 10000,
      });
    }
  }, [budget, isOpen]);

  if (!isOpen) return null;

  const handleCategoryBudgetChange = (catId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCategoryBudgets((prev) => ({
      ...prev,
      [catId]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalBudgetStr) || 0;
    onSaveBudget({
      month: currentMonth,
      totalBudget: total,
      categoryBudgets,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ตั้งงบประมาณประจำเดือน
              </h2>
              <p className="text-xs text-slate-500">
                เดือน {currentMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Total Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              งบประมาณรวมทั้งเดือน (บาท)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ฿
              </div>
              <input
                type="number"
                step="100"
                placeholder="เช่น 30,000"
                value={totalBudgetStr}
                onChange={(e) => setTotalBudgetStr(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              ระบบจะคอยเปรียบเทียบค่าใช้จ่ายจริงเทียบกับงบประมาณที่คุณตั้งไว้
            </p>
          </div>

          {/* Category Budgets */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              งบประมาณรายหมวดหมู่ (ไม่บังคับ)
            </h4>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {expenseCategories.map((cat) => {
                const assignedBudget = categoryBudgets[cat.id] || 0;
                const actualSpent = actualCategorySpends[cat.id] || 0;
                const percentUsed = assignedBudget > 0 ? (actualSpent / assignedBudget) * 100 : 0;
                const isOver = assignedBudget > 0 && actualSpent > assignedBudget;

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">งบ: ฿</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={assignedBudget || ''}
                          onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-right focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {assignedBudget > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>ใช้ไป ฿{actualSpent.toLocaleString()}</span>
                          <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                            {percentUsed.toFixed(0)}% {isOver && '(เกินงบ)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              บันทึกงบประมาณ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
