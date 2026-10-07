/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, MonthlyBudget, UserFirebaseConfig, Category } from './types/finance';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredBudgets,
  saveStoredBudgets,
  getStoredCategories,
} from './services/storage';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  syncUploadToFirebase,
} from './services/firebase';
import { Navbar } from './components/Navbar';
import { MonthlySummaryCards } from './components/MonthlySummaryCards';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { FirebaseModal } from './components/FirebaseModal';
import { ExportImportModal } from './components/ExportImportModal';
import { Plus, Cloud, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Current active month (format: YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // App core states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [firebaseConfig, setFirebaseConfig] = useState<UserFirebaseConfig>(() =>
    getSavedFirebaseConfig()
  );

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const txs = getStoredTransactions();
    const bgts = getStoredBudgets();
    const cats = getStoredCategories();
    setTransactions(txs);
    setBudgets(bgts);
    setCategories(cats);
  }, []);

  // Save changes to transactions
  const handleTransactionsChange = useCallback(
    (newTxs: Transaction[]) => {
      setTransactions(newTxs);
      saveStoredTransactions(newTxs);

      // Auto-sync to Firebase in background if configured
      if (firebaseConfig.isEnabled && firebaseConfig.projectId && firebaseConfig.apiKey) {
        syncUploadToFirebase(firebaseConfig, newTxs, budgets).catch((err) =>
          console.warn('Background sync error:', err)
        );
      }
    },
    [firebaseConfig, budgets]
  );

  // Save changes to budgets
  const handleBudgetsChange = useCallback(
    (newBudgets: MonthlyBudget[]) => {
      setBudgets(newBudgets);
      saveStoredBudgets(newBudgets);

      if (firebaseConfig.isEnabled && firebaseConfig.projectId && firebaseConfig.apiKey) {
        syncUploadToFirebase(firebaseConfig, transactions, newBudgets).catch((err) =>
          console.warn('Background sync error:', err)
        );
      }
    },
    [firebaseConfig, transactions]
  );

  // Add / Edit Transaction
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      // Update existing
      const updated = transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              ...txData,
              updatedAt: Date.now(),
            }
          : t
      );
      handleTransactionsChange(updated);
      showToast('บันทึกการแก้ไขรายการเรียบร้อยแล้ว');
    } else {
      // Create new
      const newTransaction: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [newTransaction, ...transactions];
      handleTransactionsChange(updated);
      showToast(
        `บันทึกรายการ ${newTransaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'} +฿${newTransaction.amount.toLocaleString()} เรียบร้อยแล้ว`
      );
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    handleTransactionsChange(updated);
    showToast('ลบรายการเรียบร้อยแล้ว');
  };

  // Duplicate Transaction
  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    handleTransactionsChange([duplicated, ...transactions]);
    showToast(`ทำสำเนารายการ "${tx.categoryName}" เป็นของวันนี้แล้ว`);
  };

  // Save budget
  const handleSaveBudget = (budget: MonthlyBudget) => {
    const existingIdx = budgets.findIndex((b) => b.month === budget.month);
    let updated: MonthlyBudget[];
    if (existingIdx >= 0) {
      updated = [...budgets];
      updated[existingIdx] = budget;
    } else {
      updated = [...budgets, budget];
    }
    handleBudgetsChange(updated);
    showToast('บันทึกงบประมาณประจำเดือนเรียบร้อยแล้ว');
  };

  // Firebase Config Updated
  const handleFirebaseConfigUpdated = (newConfig: UserFirebaseConfig) => {
    setFirebaseConfig(newConfig);
    saveFirebaseConfig(newConfig);
    showToast(
      newConfig.isEnabled && newConfig.projectId
        ? `เชื่อมต่อกับ Firebase โปรเจกต์ "${newConfig.projectId}" เรียบร้อยแล้ว`
        : 'อัปเดตการตั้งค่าแล้ว'
    );
  };

  // Imported Data (from Firebase or File)
  const handleDataImported = (importedTxs: Transaction[], importedBudgets?: MonthlyBudget[]) => {
    setTransactions(importedTxs);
    saveStoredTransactions(importedTxs);
    if (importedBudgets) {
      setBudgets(importedBudgets);
      saveStoredBudgets(importedBudgets);
    }
    showToast(`โหลดข้อมูลสำเร็จ (${importedTxs.length} รายการ)`);
  };

  // Current month budget
  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === currentMonth);
  }, [budgets, currentMonth]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        firebaseConfig={firebaseConfig}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenExportImportModal={() => setIsExportImportModalOpen(true)}
        onOpenAddModal={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
      />

      {/* Hero / Quick Notice Banner if Firebase not yet linked */}
      {(!firebaseConfig.isEnabled || !firebaseConfig.projectId) && (
        <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                พร้อมเชื่อมต่อ Firebase โปรเจกต์ของคุณแล้ว หรือบันทึกข้อมูลออฟไลน์ในเครื่องได้ทันที
              </span>
            </div>
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold shadow-2xs transition-colors shrink-0"
            >
              ตั้งค่าโปรเจกต์ Firebase &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Monthly Summary Cards */}
        <MonthlySummaryCards
          transactions={transactions}
          currentMonth={currentMonth}
          budget={currentBudget}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        />

        {/* 2. Visual Analytics & Charts */}
        <AnalyticsCharts
          transactions={transactions}
          currentMonth={currentMonth}
        />

        {/* 3. Transaction History & Filtering List */}
        <TransactionList
          transactions={transactions}
          categories={categories}
          currentMonth={currentMonth}
          onEdit={(tx) => {
            setEditingTx(tx);
            setIsTxModalOpen(true);
          }}
          onDelete={handleDeleteTransaction}
          onDuplicate={handleDuplicateTransaction}
          onAddNew={() => {
            setEditingTx(null);
            setIsTxModalOpen(true);
          }}
        />
      </main>

      {/* Floating Add Button for Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => {
            setEditingTx(null);
            setIsTxModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">MoneyTracker</span> —
            ระบบจัดการรายรับรายจ่าย สรุปผลรายเดือนและกราฟวิเคราะห์ข้อมูล
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              ตั้งค่า Firebase
            </button>
            <button
              onClick={() => setIsExportImportModalOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              สำรองข้อมูล
            </button>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              งบประมาณ
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        initialData={editingTx}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentMonth={currentMonth}
        budget={currentBudget}
        onSaveBudget={handleSaveBudget}
        categories={categories}
        transactions={transactions}
      />

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        config={firebaseConfig}
        onConfigUpdated={handleFirebaseConfigUpdated}
        transactions={transactions}
        budgets={budgets}
        onTransactionsImported={handleDataImported}
      />

      <ExportImportModal
        isOpen={isExportImportModalOpen}
        onClose={() => setIsExportImportModalOpen(false)}
        transactions={transactions}
        budgets={budgets}
        onDataImported={handleDataImported}
      />
    </div>
  );
}
