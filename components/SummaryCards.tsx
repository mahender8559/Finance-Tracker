'use client';

import type { LedgerEntry, OverallStats } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props { expenses: number; income: number; investments: LedgerEntry; savings: LedgerEntry; stats: OverallStats; netFlow: number; }
function SummaryStat({ label, item, color, allTime }: { label: string; item: LedgerEntry; color: string; allTime?: number }) {
  return <div className="flex min-w-0 flex-1 flex-col border-b border-slate-200 bg-slate-50/60 last:border-b-0 dark:border-slate-700 dark:bg-slate-800/30 md:border-b-0 md:border-r md:last:border-r-0">
    <div className="border-b border-slate-200 bg-slate-100/80 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{label}</div>
    <div className={`flex flex-1 flex-col items-center justify-center py-4 text-xl font-bold ${color}`}>
      <span>₹{formatCurrency(Number(item.amount))}</span>
      {allTime !== undefined && <span className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">All-time: ₹{formatCurrency(allTime)}</span>}
    </div>
  </div>;
}
export function SummaryCards({ expenses, income, investments, savings, stats, netFlow }: Props) {
  return <section aria-label="Monthly summary" className="mb-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 md:grid-cols-5 md:mb-8">
    <SummaryStat label="Income" item={{ id: 'income', month: '', category: 'Income', amount: income, type: 'Summary' }} color="text-sky-600 dark:text-sky-400" />
    <div className="flex min-w-0 flex-1 flex-col border-b border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30 sm:border-r md:border-b-0"><div className="border-b border-slate-200 bg-slate-100/80 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Expenses</div><div className="flex flex-1 items-center justify-center py-4 text-xl font-bold text-rose-600">₹{formatCurrency(expenses)}</div></div>
    <SummaryStat label="Investments" item={investments} color="text-emerald-600 dark:text-emerald-400" allTime={stats.investments} />
    <SummaryStat label="Savings" item={savings} color="text-blue-600 dark:text-blue-400" allTime={stats.savings} />
    <div className="flex min-w-0 flex-1 flex-col bg-slate-50/60 dark:bg-slate-800/30"><div className="border-b border-slate-200 bg-slate-100/80 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Net money flow</div><div className={`flex flex-1 items-center justify-center py-4 text-xl font-bold ${netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{netFlow >= 0 ? '+' : ''}₹{formatCurrency(netFlow)}</div></div>
  </section>;
}
