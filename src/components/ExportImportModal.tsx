import React, { useRef, useState } from 'react';
import { Transaction, MonthlyBudget } from '../types/finance';
import {
  exportTransactionsToCSV,
  parseCSVToTransactions,
  seedInitialDemoData,
} from '../services/storage';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  onDataImported: (transactions: Transaction[], budgets?: MonthlyBudget[]) => void;
}

export const ExportImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
  onDataImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Export CSV
  const handleExportCSV = () => {
    const csvData = exportTransactionsToCSV(transactions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneytracker_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'ส่งออกไฟล์ CSV สำหรับ Excel สำเร็จแล้ว' });
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneytracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'ส่งออกไฟล์สำรองข้อมูล JSON สำเร็จแล้ว' });
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.transactions)) {
            onDataImported(parsed.transactions, parsed.budgets);
            setStatusMsg({
              type: 'success',
              text: `นำเข้าข้อมูล JSON สำเร็จ (${parsed.transactions.length} รายการ)`,
            });
            return;
          } else if (Array.isArray(parsed)) {
            onDataImported(parsed);
            setStatusMsg({
              type: 'success',
              text: `นำเข้าข้อมูล JSON สำเร็จ (${parsed.length} รายการ)`,
            });
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          const partials = parseCSVToTransactions(content);
          if (partials.length > 0) {
            const newTxs: Transaction[] = partials.map((p, idx) => ({
              id: `imported_${Date.now()}_${idx}`,
              type: p.type || 'expense',
              amount: p.amount || 0,
              categoryId: 'exp_other',
              categoryName: p.categoryName || 'ทั่วไป',
              categoryIcon: 'Tag',
              categoryColor: '#64748b',
              date: p.date || new Date().toISOString().split('T')[0],
              time: p.time || '12:00',
              note: p.note || '',
              paymentMethod: p.paymentMethod || 'bank_transfer',
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }));
            onDataImported([...newTxs, ...transactions]);
            setStatusMsg({
              type: 'success',
              text: `นำเข้าข้อมูล CSV สำเร็จ (${newTxs.length} รายการ)`,
            });
            return;
          }
        }
        setStatusMsg({ type: 'error', text: 'รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ JSON หรือ CSV' });
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDemoData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลและโหลดตัวอย่างรายการรายรับรายจ่ายเริ่มต้นใช่หรือไม่?')) {
      const demo = seedInitialDemoData();
      onDataImported(demo);
      setStatusMsg({ type: 'success', text: 'รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้นเรียบร้อยแล้ว' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">สำรองและนำเข้าข้อมูล</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Export section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              ส่งออกข้อมูล (Export)
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportCSV}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col gap-1.5"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">ส่งออก CSV (Excel)</span>
                <span className="text-[11px] text-slate-400">รองรับภาษาไทยสำหรับ Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col gap-1.5"
              >
                <FileCode className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">ส่งออก JSON</span>
                <span className="text-[11px] text-slate-400">สำรองข้อมูลทั้งหมดครบถ้วน</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              นำเข้าข้อมูล (Import)
            </h4>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl text-center transition-colors flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-6 h-6 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ .csv หรือ .json
              </span>
              <span className="text-[11px] text-slate-400">
                นำเข้ารายการจากไฟล์สำรองเดิม
              </span>
            </button>
          </div>

          {/* Reset Demo data */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              โหลดชุดข้อมูลตัวอย่าง (Demo Data)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
