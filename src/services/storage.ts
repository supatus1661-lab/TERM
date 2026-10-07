import { Transaction, MonthlyBudget, Category } from '../types/finance';
import { ALL_DEFAULT_CATEGORIES } from '../constants/categories';

const TRANSACTIONS_KEY = 'moneytracker_transactions_data';
const BUDGETS_KEY = 'moneytracker_budgets_data';
const CUSTOM_CATEGORIES_KEY = 'moneytracker_custom_categories';

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading transactions from localStorage', err);
  }
  return seedInitialDemoData();
}

export function saveStoredTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed saving transactions to localStorage', err);
  }
}

export function getStoredBudgets(): MonthlyBudget[] {
  try {
    const raw = localStorage.getItem(BUDGETS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading budgets', err);
  }
  // Default budget for current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return [
    {
      month: currentMonth,
      totalBudget: 35000,
      categoryBudgets: {
        exp_food: 12000,
        exp_housing: 10000,
        exp_transport: 4000,
        exp_shopping: 5000,
        exp_bills: 2500,
      },
    },
  ];
}

export function saveStoredBudgets(budgets: MonthlyBudget[]) {
  try {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  } catch (err) {
    console.error('Failed saving budgets', err);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (raw) {
      const custom: Category[] = JSON.parse(raw);
      return [...ALL_DEFAULT_CATEGORIES, ...custom];
    }
  } catch (e) {
    console.warn(e);
  }
  return ALL_DEFAULT_CATEGORIES;
}

export function saveCustomCategory(category: Category) {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const existing: Category[] = raw ? JSON.parse(raw) : [];
    existing.push(category);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error(e);
  }
}

// Generates comprehensive realistic demo data for the current month and previous month
export function seedInitialDemoData(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const ym = `${year}-${pad(month)}`;

  const demoList: Transaction[] = [
    // Current Month Income
    {
      id: 'tx_seed_1',
      type: 'income',
      amount: 45000,
      categoryId: 'inc_salary',
      categoryName: 'เงินเดือนประจำ',
      categoryIcon: 'Briefcase',
      categoryColor: '#10b981',
      date: `${ym}-01`,
      time: '09:00',
      note: 'เงินเดือนโอนเข้าบัญชีหลัก',
      paymentMethod: 'bank_transfer',
      tags: ['งานประจำ'],
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'tx_seed_2',
      type: 'income',
      amount: 8500,
      categoryId: 'inc_freelance',
      categoryName: 'ฟรีแลนซ์ / งานพิเศษ',
      categoryIcon: 'Laptop',
      categoryColor: '#0284c7',
      date: `${ym}-10`,
      time: '14:30',
      note: 'รับงานออกแบบกราฟิกและเว็บไซต์',
      paymentMethod: 'promptpay',
      tags: ['ฟรีแลนซ์'],
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'tx_seed_3',
      type: 'income',
      amount: 1500,
      categoryId: 'inc_investment',
      categoryName: 'เงินปันผล / กำไรหุ้น / ดอกเบี้ย',
      categoryIcon: 'LineChart',
      categoryColor: '#d97706',
      date: `${ym}-15`,
      time: '11:00',
      note: 'เงินปันผลกองทุนรวม',
      paymentMethod: 'bank_transfer',
      tags: ['เงินออม'],
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 10,
    },

    // Current Month Expenses
    {
      id: 'tx_seed_4',
      type: 'expense',
      amount: 9500,
      categoryId: 'exp_housing',
      categoryName: 'ค่าที่พัก / คอนโด / ค่าน้ำไฟ',
      categoryIcon: 'Home',
      categoryColor: '#6366f1',
      date: `${ym}-02`,
      time: '10:00',
      note: 'ค่าเช่าคอนโดประจำเดือน',
      paymentMethod: 'bank_transfer',
      tags: ['รายจ่ายคงที่'],
      createdAt: Date.now() - 86400000 * 19,
      updatedAt: Date.now() - 86400000 * 19,
    },
    {
      id: 'tx_seed_5',
      type: 'expense',
      amount: 1200,
      categoryId: 'exp_bills',
      categoryName: 'ค่าบริการ / อินเทอร์เน็ต / โทรศัพท์',
      categoryIcon: 'Receipt',
      categoryColor: '#14b8a6',
      date: `${ym}-03`,
      time: '12:15',
      note: 'ค่าเน็ตบ้านไฟเบอร์ + ค่าบริการมือถือ',
      paymentMethod: 'promptpay',
      tags: ['บิล'],
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now() - 86400000 * 18,
    },
    {
      id: 'tx_seed_6',
      type: 'expense',
      amount: 320,
      categoryId: 'exp_food',
      categoryName: 'อาหารและเครื่องดื่ม',
      categoryIcon: 'Utensils',
      categoryColor: '#f97316',
      date: `${ym}-04`,
      time: '12:45',
      note: 'มื้อเที่ยง ข้าวราดแกงและกาแฟอเมริกาโน่',
      paymentMethod: 'promptpay',
      tags: ['มื้อเที่ยง'],
      createdAt: Date.now() - 86400000 * 17,
      updatedAt: Date.now() - 86400000 * 17,
    },
    {
      id: 'tx_seed_7',
      type: 'expense',
      amount: 1450,
      categoryId: 'exp_transport',
      categoryName: 'การเดินทาง / ค่าน้ำมัน',
      categoryIcon: 'Car',
      categoryColor: '#3b82f6',
      date: `${ym}-05`,
      time: '08:30',
      note: 'เติมน้ำมันเต็มถัง และเติมบัตร BTS',
      paymentMethod: 'credit_card',
      tags: ['เดินทาง'],
      createdAt: Date.now() - 86400000 * 16,
      updatedAt: Date.now() - 86400000 * 16,
    },
    {
      id: 'tx_seed_8',
      type: 'expense',
      amount: 2190,
      categoryId: 'exp_shopping',
      categoryName: 'ช้อปปิ้ง / ของใช้ส่วนตัว',
      categoryIcon: 'ShoppingBag',
      categoryColor: '#ec4899',
      date: `${ym}-07`,
      time: '16:00',
      note: 'ซื้อของใช้เข้าบ้าน ซูเปอร์มาร์เก็ต',
      paymentMethod: 'credit_card',
      tags: ['ของใช้'],
      createdAt: Date.now() - 86400000 * 14,
      updatedAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'tx_seed_9',
      type: 'expense',
      amount: 850,
      categoryId: 'exp_food',
      categoryName: 'อาหารและเครื่องดื่ม',
      categoryIcon: 'Utensils',
      categoryColor: '#f97316',
      date: `${ym}-09`,
      time: '19:30',
      note: 'ชาบูกับเพื่อนวันศุกร์',
      paymentMethod: 'promptpay',
      tags: ['สังสรรค์'],
      createdAt: Date.now() - 86400000 * 12,
      updatedAt: Date.now() - 86400000 * 12,
    },
    {
      id: 'tx_seed_10',
      type: 'expense',
      amount: 499,
      categoryId: 'exp_entertainment',
      categoryName: 'บันเทิง / ท่องเที่ยว / สตรีมมิ่ง',
      categoryIcon: 'Tv',
      categoryColor: '#8b5cf6',
      date: `${ym}-11`,
      time: '20:00',
      note: 'ค่าสมาชิก Netflix และ Spotify Family',
      paymentMethod: 'credit_card',
      tags: ['บันเทิง'],
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'tx_seed_11',
      type: 'expense',
      amount: 600,
      categoryId: 'exp_health',
      categoryName: 'สุขภาพ / ยารักษาโรค / ประกัน',
      categoryIcon: 'HeartPulse',
      categoryColor: '#ef4444',
      date: `${ym}-13`,
      time: '15:20',
      note: 'ซื้อวิตามินและยาแก้แพ้ที่ร้านขายยา',
      paymentMethod: 'cash',
      tags: ['สุขภาพ'],
      createdAt: Date.now() - 86400000 * 8,
      updatedAt: Date.now() - 86400000 * 8,
    },
    {
      id: 'tx_seed_12',
      type: 'expense',
      amount: 5000,
      categoryId: 'exp_invest',
      categoryName: 'การลงทุน / ออมเงิน',
      categoryIcon: 'TrendingUp',
      categoryColor: '#10b981',
      date: `${ym}-14`,
      time: '10:00',
      note: 'DCA กองทุนรวมดัชนี S&P 500',
      paymentMethod: 'bank_transfer',
      tags: ['ลงทุน'],
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'tx_seed_13',
      type: 'expense',
      amount: 450,
      categoryId: 'exp_food',
      categoryName: 'อาหารและเครื่องดื่ม',
      categoryIcon: 'Utensils',
      categoryColor: '#f97316',
      date: `${ym}-16`,
      time: '13:00',
      note: 'อาหารกลางวัน + เบเกอรี่',
      paymentMethod: 'promptpay',
      tags: ['มื้อเที่ยง'],
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 5,
    },
  ];

  saveStoredTransactions(demoList);
  return demoList;
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ['ID', 'วันที่', 'เวลา', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน(บาท)', 'วิธีชำระ', 'โน้ต/บันทึก', 'แท็ก'];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.time || '',
    t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    `"${t.categoryName.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.paymentMethod,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${(t.tags || []).join(', ')}"`,
  ]);

  // UTF-8 BOM so Excel opens Thai language correctly
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function parseCSVToTransactions(csvContent: string): Partial<Transaction>[] {
  const lines = csvContent.replace(/^\uFEFF/, '').trim().split('\n');
  if (lines.length < 2) return [];

  const parsed: Partial<Transaction>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple regex parser for csv cells with quotes
    const cells = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const cleanCells = cells.map((c) => c.replace(/^"|"$/g, '').trim());

    if (cleanCells.length >= 6) {
      const typeStr = cleanCells[3];
      const type = typeStr.includes('รับ') || typeStr.toLowerCase() === 'income' ? 'income' : 'expense';
      const amount = parseFloat(cleanCells[5]) || 0;
      if (amount > 0) {
        parsed.push({
          date: cleanCells[1],
          time: cleanCells[2] || '12:00',
          type,
          categoryName: cleanCells[4],
          amount,
          paymentMethod: (cleanCells[6] as any) || 'bank_transfer',
          note: cleanCells[7] || '',
        });
      }
    }
  }
  return parsed;
}
