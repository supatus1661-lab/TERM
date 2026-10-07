import { Category } from '../types/finance';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp_food', name: 'อาหารและเครื่องดื่ม', type: 'expense', icon: 'Utensils', color: '#f97316' }, // Orange
  { id: 'exp_transport', name: 'การเดินทาง / ค่าน้ำมัน', type: 'expense', icon: 'Car', color: '#3b82f6' }, // Blue
  { id: 'exp_housing', name: 'ค่าที่พัก / คอนโด / ค่าน้ำไฟ', type: 'expense', icon: 'Home', color: '#6366f1' }, // Indigo
  { id: 'exp_shopping', name: 'ช้อปปิ้ง / ของใช้ส่วนตัว', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' }, // Pink
  { id: 'exp_entertainment', name: 'บันเทิง / ท่องเที่ยว / สตรีมมิ่ง', type: 'expense', icon: 'Tv', color: '#8b5cf6' }, // Purple
  { id: 'exp_health', name: 'สุขภาพ / ยารักษาโรค / ประกัน', type: 'expense', icon: 'HeartPulse', color: '#ef4444' }, // Red
  { id: 'exp_education', name: 'การศึกษา / หนังสือ / คอร์ส', type: 'expense', icon: 'BookOpen', color: '#0ea5e9' }, // Sky
  { id: 'exp_bills', name: 'ค่าบริการ / อินเทอร์เน็ต / โทรศัพท์', type: 'expense', icon: 'Receipt', color: '#14b8a6' }, // Teal
  { id: 'exp_invest', name: 'การลงทุน / ออมเงิน', type: 'expense', icon: 'TrendingUp', color: '#10b981' }, // Emerald
  { id: 'exp_family', name: 'ครอบครัว / ให้พ่อแม่ / สัตว์เลี้ยง', type: 'expense', icon: 'Users', color: '#f59e0b' }, // Amber
  { id: 'exp_other', name: 'รายจ่ายอื่นๆ', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' }, // Slate
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc_salary', name: 'เงินเดือนประจำ', type: 'income', icon: 'Briefcase', color: '#10b981' }, // Emerald
  { id: 'inc_bonus', name: 'โบนัส / ค่าล่วงเวลา (OT)', type: 'income', icon: 'Gift', color: '#059669' }, // Dark Emerald
  { id: 'inc_freelance', name: 'ฟรีแลนซ์ / งานพิเศษ', type: 'income', icon: 'Laptop', color: '#0284c7' }, // Blue
  { id: 'inc_business', name: 'ธุรกิจส่วนตัว / ค้าขาย', type: 'income', icon: 'Store', color: '#8b5cf6' }, // Purple
  { id: 'inc_investment', name: 'เงินปันผล / กำไรหุ้น / ดอกเบี้ย', type: 'income', icon: 'LineChart', color: '#d97706' }, // Amber
  { id: 'inc_gift', name: 'ของขวัญ / ได้รับเงินช่วยเหลือ', type: 'income', icon: 'Sparkles', color: '#ec4899' }, // Pink
  { id: 'inc_other', name: 'รายรับอื่นๆ', type: 'income', icon: 'DollarSign', color: '#64748b' }, // Slate
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

export const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  cash: { label: 'เงินสด', icon: 'Banknote' },
  bank_transfer: { label: 'โอนเงิน', icon: 'CreditCard' },
  promptpay: { label: 'พร้อมเพย์', icon: 'QrCode' },
  credit_card: { label: 'บัตรเครดิต', icon: 'CreditCard' },
  e_wallet: { label: 'E-Wallet', icon: 'Smartphone' },
};
