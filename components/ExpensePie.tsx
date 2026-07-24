'use client';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useTheme } from '@/context/theme-context';
import { CHART_COLORS } from '@/utils/finance';

export function ExpensePie({ data }: { data: { name: string; value: number }[] }) {
  const { theme } = useTheme(); const text = theme === 'dark' ? '#cbd5e1' : '#475569';
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200"><span className="h-2 w-2 rounded-full bg-indigo-500" />Expense breakdown</h2>{data.length === 0 ? <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">Add actual expenses to view chart</div> : <div className="h-64 w-full"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={52} outerRadius={82} stroke="none">{data.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500, color: text }} /></PieChart></ResponsiveContainer></div>}</section>;
}
