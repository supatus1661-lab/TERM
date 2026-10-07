import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { PieChart, BarChart2, TrendingUp, Layers } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currentMonth: string; // YYYY-MM
}

export const AnalyticsCharts: React.FC<Props> = ({ transactions, currentMonth }) => {
  const [activeTab, setActiveTab] = useState<'donut' | 'bar' | 'trend'>('donut');
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Filter current month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Expenses only
  const expenseTransactions = useMemo(() => {
    return monthTransactions.filter((t) => t.type === 'expense');
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [expenseTransactions]);

  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthTransactions]);

  // Group expenses by category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; icon: string; total: number; count: number }>();

    expenseTransactions.forEach((t) => {
      const existing = map.get(t.categoryId);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        map.set(t.categoryId, {
          id: t.categoryId,
          name: t.categoryName,
          color: t.categoryColor || '#f97316',
          icon: t.categoryIcon || 'Utensils',
          total: t.amount,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenseTransactions]);

  // Calculate Donut Arc segments
  const donutSegments = useMemo(() => {
    if (totalExpense === 0 || categoryBreakdown.length === 0) return [];

    let currentAngle = 0;
    return categoryBreakdown.map((cat, idx) => {
      const percentage = (cat.total / totalExpense) * 100;
      const angle = (cat.total / totalExpense) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        ...cat,
        percentage,
        startAngle,
        endAngle,
        index: idx,
      };
    });
  }, [categoryBreakdown, totalExpense]);

  // Helper for SVG donut path
  const getCoordinatesForPercent = (angleInDegrees: number, radius: number, cx = 100, cy = 100) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    // Edge case if 100% full circle
    const diff = endAngle - startAngle;
    const isFull = diff >= 359.9;
    const safeEnd = isFull ? startAngle + 359.99 : endAngle;

    const startOuter = getCoordinatesForPercent(startAngle, outerRadius);
    const endOuter = getCoordinatesForPercent(safeEnd, outerRadius);
    const startInner = getCoordinatesForPercent(safeEnd, innerRadius);
    const endInner = getCoordinatesForPercent(startAngle, innerRadius);

    const largeArcFlag = diff > 180 ? 1 : 0;

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  // Group by day of month (1..31) for Bar Chart and Trend
  const dailyData = useMemo(() => {
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: { day: number; dateStr: string; income: number; expense: number; net: number; cumBalance: number }[] = [];
    let runningBalance = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentMonth}-${dayStr}`;

      const txs = monthTransactions.filter((t) => t.date === dateStr);
      const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      runningBalance += net;

      days.push({
        day: d,
        dateStr,
        income: inc,
        expense: exp,
        net,
        cumBalance: runningBalance,
      });
    }

    return days;
  }, [monthTransactions, currentMonth]);

  // Max value for bar scaling
  const maxBarValue = useMemo(() => {
    const maxVal = Math.max(...dailyData.map((d) => Math.max(d.income, d.expense)), 100);
    return maxVal;
  }, [dailyData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header and Chart Switcher */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            กราฟวิเคราะห์ข้อมูลประจำเดือน
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปการเคลื่อนไหวทางการเงินและสัดส่วนค่าใช้จ่าย
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'donut'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            สัดส่วนหมวดหมู่
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'bar'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            รายรับ vs รายจ่ายรายวัน
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'trend'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            แนวโน้มกระแสเงินสด
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-6">
        {/* VIEW 1: DONUT CHART */}
        {activeTab === 'donut' && (
          <div>
            {totalExpense === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-600">ยังไม่มีรายการค่าใช้จ่ายในเดือนนี้</p>
                <p className="text-xs text-slate-400 mt-1">เพิ่มรายการเพื่อแสดงกราฟสัดส่วนหมวดหมู่</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Donut SVG */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                  <div className="relative w-56 h-56">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {donutSegments.map((segment) => {
                        const isHovered = hoveredSlice === segment.index;
                        const outer = isHovered ? 92 : 88;
                        const inner = 54;
                        const pathD = createArc(segment.startAngle, segment.endAngle, outer, inner);

                        return (
                          <path
                            key={segment.id}
                            d={pathD}
                            fill={segment.color}
                            className="transition-all duration-200 cursor-pointer hover:opacity-90"
                            onMouseEnter={() => setHoveredSlice(segment.index)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        );
                      })}
                    </svg>

                    {/* Center text in donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                      {hoveredSlice !== null && donutSegments[hoveredSlice] ? (
                        <>
                          <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
                            {donutSegments[hoveredSlice].name}
                          </span>
                          <span className="text-lg font-bold text-slate-900 mt-0.5">
                            ฿{donutSegments[hoveredSlice].total.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-indigo-600 mt-0.5">
                            {donutSegments[hoveredSlice].percentage.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400 font-medium">ค่าใช้จ่ายรวม</span>
                          <span className="text-lg font-bold text-slate-900 mt-0.5">
                            ฿{totalExpense.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {categoryBreakdown.length} หมวดหมู่
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories List with Progress and Details */}
                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    หมวดหมู่ค่าใช้จ่ายสูงสุด (เรียงตามจำนวนเงิน)
                  </h4>
                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    {categoryBreakdown.map((cat, idx) => {
                      const pct = totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0;
                      const isHovered = hoveredSlice === idx;

                      return (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setHoveredSlice(idx)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isHovered
                              ? 'bg-slate-50 border-slate-300 shadow-xs scale-[1.01]'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-800">{cat.name}</span>
                              <span className="text-slate-400 text-[11px]">({cat.count} รายการ)</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900">฿{cat.total.toLocaleString()}</span>
                              <span className="ml-2 font-medium text-slate-500">{pct.toFixed(1)}%</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DAILY INCOME VS EXPENSE BAR CHART */}
        {activeTab === 'bar' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-600">รายรับ: ฿{totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-rose-500" />
                  <span className="text-slate-600">รายจ่าย: ฿{totalExpense.toLocaleString()}</span>
                </div>
              </div>
              <span className="text-xs text-slate-400">ชี้เมาส์ที่แท่งกราฟเพื่อดูรายละเอียดวัน</span>
            </div>

            {/* Bars container */}
            <div className="h-64 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-200 overflow-x-auto">
              {dailyData.map((d) => {
                const incomeH = maxBarValue > 0 ? (d.income / maxBarValue) * 190 : 0;
                const expenseH = maxBarValue > 0 ? (d.expense / maxBarValue) * 190 : 0;
                const isHovered = hoveredBar === d.day;
                const hasData = d.income > 0 || d.expense > 0;

                return (
                  <div
                    key={d.day}
                    className="flex-1 min-w-[20px] flex flex-col items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBar(d.day)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && hasData && (
                      <div className="absolute -top-24 z-20 bg-slate-900 text-white text-[11px] rounded-lg p-2 shadow-lg min-w-[130px] pointer-events-none transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95">
                        <p className="font-semibold border-b border-slate-700 pb-1 mb-1 text-slate-200">
                          วันที่ {d.day} ({d.dateStr})
                        </p>
                        {d.income > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>รับ:</span>
                            <span>+฿{d.income.toLocaleString()}</span>
                          </div>
                        )}
                        {d.expense > 0 && (
                          <div className="flex justify-between text-rose-400">
                            <span>จ่าย:</span>
                            <span>-฿{d.expense.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-700 pt-1 mt-1 font-bold text-white">
                          <span>คงเหลือ:</span>
                          <span className={d.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {d.net >= 0 ? '+' : ''}฿{d.net.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-0.5 h-48">
                      {/* Income Bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-emerald-500 hover:bg-emerald-400 rounded-t-xs transition-all duration-200"
                        style={{ height: `${Math.max(incomeH, d.income > 0 ? 4 : 0)}px` }}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-rose-500 hover:bg-rose-400 rounded-t-xs transition-all duration-200"
                        style={{ height: `${Math.max(expenseH, d.expense > 0 ? 4 : 0)}px` }}
                      />
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-[10px] mt-2 block ${
                        hasData ? 'font-bold text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>ต้นเดือน</span>
              <span>กลางเดือน</span>
              <span>สิ้นเดือน</span>
            </div>
          </div>
        )}

        {/* VIEW 3: CUMULATIVE CASHFLOW TREND */}
        {activeTab === 'trend' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">
                  กราฟแสดงการเปลี่ยนแปลงของยอดเงินสะสม (สุทธิ) ตลอดทั้งเดือน
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">ยอดสุทธิสิ้นเดือน: </span>
                <span
                  className={`text-sm font-bold ${
                    totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {totalIncome - totalExpense >= 0 ? '+' : ''}฿
                  {(totalIncome - totalExpense).toLocaleString()}
                </span>
              </div>
            </div>

            {/* SVG Line / Area Graph */}
            <div className="w-full h-60 relative">
              {(() => {
                const values = dailyData.map((d) => d.cumBalance);
                const minVal = Math.min(0, ...values);
                const maxVal = Math.max(1000, ...values);
                const range = maxVal - minVal || 1;

                const width = 800;
                const height = 200;
                const padX = 20;
                const padY = 20;

                const points = dailyData.map((d, i) => {
                  const x = padX + (i / (dailyData.length - 1)) * (width - 2 * padX);
                  const y = height - padY - ((d.cumBalance - minVal) / range) * (height - 2 * padY);
                  return { x, y, ...d };
                });

                const lineD = points.reduce((acc, p, i) => {
                  return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');

                const zeroY = height - padY - ((0 - minVal) / range) * (height - 2 * padY);

                const areaD = `${lineD} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Zero Reference Line */}
                    <line
                      x1={padX}
                      y1={zeroY}
                      x2={width - padX}
                      y2={zeroY}
                      stroke="#cbd5e1"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />

                    {/* Area fill */}
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#trendGradient)" />

                    {/* Smooth Line */}
                    <path d={lineD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Points */}
                    {points
                      .filter((p) => p.income > 0 || p.expense > 0 || p.day === 1 || p.day === points.length)
                      .map((p) => (
                        <circle
                          key={p.day}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#4f46e5"
                          strokeWidth="2"
                          className="hover:r-6 cursor-pointer transition-all"
                        >
                          <title>{`วันที่ ${p.day}: สะสม ฿${p.cumBalance.toLocaleString()}`}</title>
                        </circle>
                      ))}
                  </svg>
                );
              })()}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-2">
              <span>วันที่ 1</span>
              <span>วันที่ 15</span>
              <span>สิ้นเดือน</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
