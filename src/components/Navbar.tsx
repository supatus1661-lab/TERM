import React from 'react';
import { UserFirebaseConfig } from '../types/finance';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  Database,
  Cloud,
  FileDown,
  Layers,
} from 'lucide-react';

interface Props {
  currentMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  firebaseConfig: UserFirebaseConfig;
  onOpenFirebaseModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenExportImportModal: () => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentMonth,
  onMonthChange,
  firebaseConfig,
  onOpenFirebaseModal,
  onOpenBudgetModal,
  onOpenExportImportModal,
  onOpenAddModal,
}) => {
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthNamesThai = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  const currentMonthLabel = `${monthNamesThai[month - 1]} ${year + 543}`;

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    onMonthChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const isConnected = firebaseConfig.isEnabled && !!firebaseConfig.projectId;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                  MoneyTracker
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  รายรับรายจ่าย
                </span>
              </div>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={handlePrevMonth}
              title="เดือนก่อนหน้า"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleSetCurrentMonth}
              title="คลิกเพื่อกลับสู่เดือนปัจจุบัน"
              className="px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-800 hover:bg-white rounded-xl transition-all whitespace-nowrap"
            >
              {currentMonthLabel}
            </button>

            <button
              onClick={handleNextMonth}
              title="เดือนถัดไป"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Firebase Status Badge & Settings */}
            <button
              onClick={onOpenFirebaseModal}
              title={
                isConnected
                  ? `เชื่อมต่อ Firebase: ${firebaseConfig.projectId}`
                  : 'คลิกเพื่อตั้งค่าเชื่อมต่อ Firebase'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline truncate max-w-[120px]">
                    {firebaseConfig.projectId}
                  </span>
                  <span className="md:hidden">Firebase</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">ตั้งค่า Firebase</span>
                </>
              )}
            </button>

            {/* Budget Button */}
            <button
              onClick={onOpenBudgetModal}
              title="ตั้งค่างบประมาณ"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              <span>งบประมาณ</span>
            </button>

            {/* Export/Import */}
            <button
              onClick={onOpenExportImportModal}
              title="สำรองข้อมูล / นำเข้าไฟล์"
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>

            {/* Add Transaction Button (CTA) */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">เพิ่มรายการ</span>
              <span className="sm:hidden">บันทึก</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
