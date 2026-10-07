import React, { useState, useMemo } from 'react';
import { Transaction, Category, PaymentMethod } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { PAYMENT_METHOD_LABELS } from '../constants/categories';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string; // YYYY-MM
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: Transaction) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<Props> = ({
  transactions,
  categories,
  currentMonth,
  onEdit,
  onDelete,
  onDuplicate,
  onAddNew,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter for current month first
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Apply search & advanced filters
  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;

        // Payment filter
        if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNote = t.note?.toLowerCase().includes(q);
          const matchCat = t.categoryName.toLowerCase().includes(q);
          const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
          const matchAmount = String(t.amount).includes(q);
          return matchNote || matchCat || matchTags || matchAmount;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '') || b.createdAt - a.createdAt;
        }
        if (sortBy === 'date-asc') {
          return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt;
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [currentMonthTransactions, typeFilter, categoryFilter, paymentFilter, search, sortBy]);

  // Group by Date for cleaner presentation
  const groupedByDate = useMemo(() => {
    const groups: {
      date: string;
      formattedDate: string;
      items: Transaction[];
      totalIncome: number;
      totalExpense: number;
    }[] = [];

    const dateMap = new Map<string, Transaction[]>();
    filteredTransactions.forEach((t) => {
      const arr = dateMap.get(t.date) || [];
      arr.push(t);
      dateMap.set(t.date, arr);
    });

    dateMap.forEach((items, dateStr) => {
      const totalIncome = items
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Format date in Thai
      const dateObj = new Date(dateStr);
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let formattedDate = dateStr;
      if (dateStr === todayStr) {
        formattedDate = 'วันนี้ (Today)';
      } else if (dateStr === yesterday) {
        formattedDate = 'เมื่อวาน (Yesterday)';
      } else {
        formattedDate = dateObj.toLocaleDateString('th-TH', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }

      groups.push({
        date: dateStr,
        formattedDate,
        items,
        totalIncome,
        totalExpense,
      });
    });

    return groups;
  }, [filteredTransactions]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setSortBy('date-desc');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-5 border-b border-slate-100 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              รายการบันทึกประจำเดือน
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredTransactions.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ค้นหาและจัดการประวัติรายรับและรายจ่าย
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เฉพาะรายจ่าย
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เฉพาะรายรับ
            </button>
          </div>
        </div>

        {/* Search Bar & Dropdown Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโน้ต, หมวดหมู่, แท็ก, จำนวนเงิน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">ทุกช่องทาง</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="date-desc">วันที่ (ใหม่สุด)</option>
              <option value="date-asc">วันที่ (เก่าสุด)</option>
              <option value="amount-desc">ยอดเงิน (มากสุด)</option>
              <option value="amount-asc">ยอดเงิน (น้อยสุด)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List Body */}
      <div className="divide-y divide-slate-100">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            <h4 className="text-sm font-semibold text-slate-700">ไม่พบรายการที่ค้นหา</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา ปรับเปลี่ยนตัวกรอง หรือเพิ่มรายการบันทึกใหม่
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ล้างตัวกรอง
              </button>
              <button
                onClick={onAddNew}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                + เพิ่มรายการใหม่
              </button>
            </div>
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.date} className="p-4 sm:p-5">
              {/* Daily Header with Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{group.formattedDate}</span>
                  <span className="text-[11px] text-slate-400">({group.items.length} รายการ)</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-600 font-medium">
                      +฿{group.totalIncome.toLocaleString()}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-rose-600 font-medium">
                      -฿{group.totalExpense.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Day Items */}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isIncome = item.type === 'income';
                  const isConfirmingDelete = deleteConfirmId === item.id;
                  const paymentInfo = PAYMENT_METHOD_LABELS[item.paymentMethod];

                  return (
                    <div
                      key={item.id}
                      className="group p-3 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-200/60 transition-all flex items-center justify-between gap-3"
                    >
                      {/* Left side: Icon & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.categoryColor || (isIncome ? '#10b981' : '#f97316') }}
                        >
                          <CategoryIcon iconName={item.categoryIcon || 'Tag'} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {item.categoryName}
                            </h4>
                            {item.time && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                {item.time}
                              </span>
                            )}
                          </div>

                          {/* Note & Tags */}
                          <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                            {item.note && (
                              <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                                {item.note}
                              </span>
                            )}
                            {item.note && paymentInfo && (
                              <span className="text-slate-300">·</span>
                            )}
                            {paymentInfo && (
                              <span className="text-[11px] text-slate-400">
                                {paymentInfo.label}
                              </span>
                            )}
                            {item.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount & Action buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-sm sm:text-base font-bold tracking-tight ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}฿
                            {item.amount.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {/* Actions */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-xl">
                            <span className="text-[11px] text-rose-700 px-1 font-medium">ลบ?</span>
                            <button
                              onClick={() => {
                                onDelete(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white text-[11px] rounded-md font-semibold hover:bg-rose-700"
                            >
                              ใช่
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] rounded-md hover:bg-slate-300"
                            >
                              ไม่
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onDuplicate(item)}
                              title="ทำสำเนารายการ"
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEdit(item)}
                              title="แก้ไขรายการ"
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              title="ลบรายการ"
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
