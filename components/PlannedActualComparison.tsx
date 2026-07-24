'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useTheme } from '@/context/theme-context';

export function PlannedActualComparison({ data, className }: { data: { category: string; planned: number; actual: number }[]; className?: string }) {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? '#94a3b8' : '#64748b';
  const grid = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6 ${className ?? ''}`}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />Planned vs Actual
      </h2>
      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">
          Add planned expenses and actual spending to compare categories.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: muted, fontWeight: 600 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: muted }} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: muted }} />
              <Bar dataKey="planned" name="Planned" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="actual" name="Actual" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
