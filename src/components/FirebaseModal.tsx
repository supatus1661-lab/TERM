import React, { useState } from 'react';
import { UserFirebaseConfig, Transaction, MonthlyBudget } from '../types/finance';
import {
  testFirebaseConnection,
  syncUploadToFirebase,
  syncDownloadFromFirebase,
  saveFirebaseConfig,
} from '../services/firebase';
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  ClipboardPaste,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: UserFirebaseConfig;
  onConfigUpdated: (config: UserFirebaseConfig) => void;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  onTransactionsImported: (transactions: Transaction[], budgets?: MonthlyBudget[]) => void;
}

export const FirebaseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  transactions,
  budgets,
  onTransactionsImported,
}) => {
  const [formData, setFormData] = useState<UserFirebaseConfig>({ ...config });
  const [rawConfigSnippet, setRawConfigSnippet] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Auto-parse when user pastes firebaseConfig block
  const handleParseSnippet = () => {
    if (!rawConfigSnippet.trim()) return;

    try {
      const apiKeyMatch = rawConfigSnippet.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = rawConfigSnippet.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = rawConfigSnippet.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = rawConfigSnippet.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = rawConfigSnippet.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = rawConfigSnippet.match(/appId:\s*["']([^"']+)["']/);

      const updated: UserFirebaseConfig = {
        ...formData,
        apiKey: apiKeyMatch ? apiKeyMatch[1] : formData.apiKey,
        authDomain: authDomainMatch ? authDomainMatch[1] : formData.authDomain,
        projectId: projectIdMatch ? projectIdMatch[1] : formData.projectId,
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : formData.storageBucket,
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : formData.messagingSenderId,
        appId: appIdMatch ? appIdMatch[1] : formData.appId,
        isEnabled: true,
      };

      setFormData(updated);
      setTestResult({
        success: true,
        message: 'แยกข้อมูลจาก Firebase Config สำเร็จ! กรุณากด "ทดสอบการเชื่อมต่อ"',
      });
    } catch (e) {
      setTestResult({
        success: false,
        message: 'ไม่สามารถแยกข้อมูลได้ กรุณากรอกช่องด้านล่างด้วยตนเอง',
      });
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSyncMessage(null);

    const res = await testFirebaseConnection(formData);
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      const updated = { ...formData, isEnabled: true };
      setFormData(updated);
      saveFirebaseConfig(updated);
      onConfigUpdated(updated);
    }
  };

  const handleUpload = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    const res = await syncUploadToFirebase(formData, transactions, budgets);
    setIsSyncing(false);

    if (res.success) {
      setSyncMessage({ type: 'success', text: res.message });
    } else {
      setSyncMessage({ type: 'error', text: res.message });
    }
  };

  const handleDownload = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    const res = await syncDownloadFromFirebase(formData);
    setIsSyncing(false);

    if (res.success && res.transactions) {
      onTransactionsImported(res.transactions, res.budgets);
      setSyncMessage({ type: 'success', text: res.message });
    } else {
      setSyncMessage({ type: 'error', text: res.message });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(formData);
    onConfigUpdated(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ตั้งค่าเชื่อมต่อ Firebase Firestore
              </h2>
              <p className="text-xs text-slate-500">
                เก็บและซิงค์ข้อมูลรายรับรายจ่ายบน Cloud Firebase ของคุณ
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

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              formData.isEnabled && formData.projectId
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Cloud className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm">
                {formData.isEnabled && formData.projectId
                  ? `เชื่อมต่อกับโปรเจกต์ "${formData.projectId}"`
                  : 'โหมดใช้งานปัจจุบัน: บันทึกข้อมูลในเครื่อง (Local Offline)'}
              </p>
              <p className="mt-0.5 text-slate-600">
                {formData.isEnabled && formData.projectId
                  ? 'ข้อมูลพร้อมซิงค์ขึ้น Cloud Firestore เรียบร้อยแล้ว'
                  : 'ข้อมูลจะถูกเก็บไว้อย่างปลอดภัยในเบราว์เซอร์ของคุณ คุณสามารถใส่ Firebase Config ด้านล่างเพื่อซิงค์ข้อมูลขึ้น Cloud ได้ทุกเมื่อ'}
              </p>
            </div>
          </div>

          {/* Quick Paste Area */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                วางโค้ด Firebase Config จาก Firebase Console (ตัวช่วยกรอกอัตโนมัติ)
              </span>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                เปิด Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <textarea
              rows={3}
              placeholder={`ตัวอย่างเช่น:
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project",
  appId: "1:..."
};`}
              value={rawConfigSnippet}
              onChange={(e) => setRawConfigSnippet(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleParseSnippet}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              ดึงค่าลงในฟอร์มอัตโนมัติ
            </button>
          </div>

          {/* Manual Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Firebase Project ID * (เช่น โปรเจกต์ที่คุณระบุ)
              </label>
              <input
                type="text"
                placeholder="เช่น money-tracker-app-2026 หรือ [ใส่ชื่อโปรเจกต์ Firebase]"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value.trim() })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Web API Key *
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value.trim() })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={formData.authDomain}
                  onChange={(e) => setFormData({ ...formData, authDomain: e.target.value.trim() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef..."
                  value={formData.appId || ''}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value.trim() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  ชื่อ Collection บน Firestore
                </label>
                <input
                  type="text"
                  placeholder="transactions"
                  value={formData.collectionName || 'transactions'}
                  onChange={(e) => setFormData({ ...formData, collectionName: e.target.value.trim() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Test & Sync Actions */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={isTesting || !formData.projectId || !formData.apiKey}
              onClick={handleTest}
              className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </button>

            <button
              type="button"
              disabled={isSyncing || !formData.projectId || !formData.apiKey}
              onClick={handleUpload}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              อัปโหลดขึ้น Cloud
            </button>

            <button
              type="button"
              disabled={isSyncing || !formData.projectId || !formData.apiKey}
              onClick={handleDownload}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              ดึงข้อมูลจาก Cloud
            </button>
          </div>

          {/* Test/Sync Result Messages */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {syncMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{syncMessage.text}</span>
            </div>
          )}

          {/* Security Note */}
          <div className="p-3.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              คำแนะนำเรื่อง Firestore Security Rules
            </div>
            <p>
              หากตั้งค่าโปรเจกต์ใหม่ กรุณาตรวจสอบแท็บ Rules ใน Cloud Firestore ให้เปิดสิทธิ์การอ่านเขียน เช่น:
            </p>
            <pre className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // หรือ if request.auth != null
    }
  }
}`}
            </pre>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ปิด
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
