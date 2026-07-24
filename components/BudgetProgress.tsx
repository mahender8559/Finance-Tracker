'use client';

import { useMemo } from 'react';
import { useTheme } from '@/context/theme-context';
import { formatCurrency } from '@/utils/finance';

export function BudgetProgress({ data, className }: { data: { category: string; planned: number; actual: number }[]; className?: string }) {
  const { theme } = useTheme();

  const rows = useMemo(() => {
    return (data ?? [])
      .map((d) => {
        const planned = Number(d.planned ?? 0);
        const actual = Number(d.actual ?? 0);
        const percent = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 200 : 0;
        return { ...d, planned, actual, percent };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [data]);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6 ${className ?? ''}`}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />Category Budget Progress
      </h2>
      {rows.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">
          Add planned expenses and actual spending to view progress.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const pct = Math.round(row.percent * 10) / 10;
            const color = row.percent > 100 ? 'bg-rose-500' : row.percent >= 80 ? 'bg-amber-400' : 'bg-emerald-500';
            const barWidth = Math.min(row.percent, 150);
            const remaining = row.planned - row.actual;
            const isOver = row.actual > row.planned;

            return (
              <div key={row.category} className="w-full">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.category}</div>
                  <div className="ml-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div>₹{formatCurrency(row.actual)} / ₹{formatCurrency(row.planned)}</div>
                    <div className="mt-0.5">{pct}%</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative w-full flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" style={{ height: 12 }}>
                    <div className={`absolute left-0 top-0 h-full ${color}`} style={{ width: `${barWidth}%`, transition: 'width 300ms ease' }} />
                    {isOver && (
                      <div className="absolute right-0 top-0 h-full w-0.5 bg-white/40" />
                    )}
                  </div>
                  <div className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                    {isOver ? <span className="text-rose-500">Over ₹{formatCurrency(Math.abs(remaining))}</span> : <span className="text-slate-500">Left ₹{formatCurrency(Math.max(0, remaining))}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
