import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, Category } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { PAYMENT_METHOD_LABELS } from '../constants/categories';
import { X, Calendar, Clock, DollarSign, FileText, Tag, Check, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  categories: Category[];
  initialData?: Transaction | null;
  defaultDate?: string;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
  defaultDate,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Suggestions for notes/tags
  const quickExpenseTags = ['มื้อเที่ยง', 'กาแฟ', 'เดินทาง/BTS', 'ของใช้เข้าบ้าน', 'ช้อปปิ้ง', 'สังสรรค์', 'ค่าน้ำไฟ'];
  const quickIncomeTags = ['เงินเดือน', 'ฟรีแลนซ์', 'โบนัส', 'ขายของ', 'เงินปันผล'];

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(String(initialData.amount));
      setSelectedCategoryId(initialData.categoryId);
      setDate(initialData.date);
      setTime(initialData.time || '12:00');
      setPaymentMethod(initialData.paymentMethod || 'bank_transfer');
      setNote(initialData.note || '');
      setTags(initialData.tags || []);
    } else {
      const now = new Date();
      const todayStr =
        defaultDate ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      setType('expense');
      setAmountStr('');
      setDate(todayStr);
      setTime(timeStr);
      setPaymentMethod('promptpay');
      setNote('');
      setTags([]);
      setError('');
    }
  }, [initialData, isOpen, defaultDate]);

  // Filter available categories for current transaction type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category when switching type if current doesn't match
  useEffect(() => {
    const isCategoryValid = filteredCategories.some((c) => c.id === selectedCategoryId);
    if (!isCategoryValid && filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, selectedCategoryId]);

  if (!isOpen) return null;

  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + val));
  };

  const handleToggleTag = (tagText: string) => {
    if (tags.includes(tagText)) {
      setTags(tags.filter((t) => t !== tagText));
    } else {
      setTags([...tags, tagText]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(customTagInput.trim())) {
        setTags([...tags, customTagInput.trim()]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return;
    }

    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    onSave(
      {
        type,
        amount,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        date,
        time,
        paymentMethod,
        note: note.trim(),
        tags,
      },
      initialData?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'แก้ไขรายการบันทึก' : 'บันทึกรายการใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Type Selector (รายจ่าย vs รายรับ) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายรับ (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xl">
                ฿
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError('');
                }}
                autoFocus={!initialData}
                required
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Quick Amount Add Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50, 100, 500, 1000, 5000].map((quickVal) => (
                <button
                  key={quickVal}
                  type="button"
                  onClick={() => handleAddQuickAmount(quickVal)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  +{quickVal.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 ml-auto"
              >
                ล้างค่า
              </button>
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              หมวดหมู่ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 line-clamp-2 leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> เวลา
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              ช่องทางการชำระเงิน
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, item]) => {
                const isSelected = paymentMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key as PaymentMethod)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> บันทึกข้อความ / รายละเอียด
            </label>
            <input
              type="text"
              placeholder="เช่น ข้าวกะเพราไข่ดาว, ช้อปปิ้งของลดราคา, เงินเดือนส่วนแรก"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            {/* Quick Suggestion Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">แท็กด่วน:</span>
              {(type === 'expense' ? quickExpenseTags : quickIncomeTags).map((quickTag) => (
                <button
                  key={quickTag}
                  type="button"
                  onClick={() => handleToggleTag(quickTag)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                    tags.includes(quickTag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  #{quickTag}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {initialData ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
