'use client';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useTheme } from '@/context/theme-context';
export function BudgetBar({ data }: { data: { name: string; amount: number; fill: string }[] }) {
  const { theme } = useTheme(); const muted = theme === 'dark' ? '#94a3b8' : '#64748b'; const grid = theme === 'dark' ? '#334155' : '#e2e8f0';
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200"><span className="h-2 w-2 rounded-full bg-emerald-500" />Budget flow overview</h2><div className="h-64 w-full"><ResponsiveContainer><BarChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: muted, fontWeight: 600 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: muted }} tickFormatter={(value) => `₹${value / 1000}k`} /><Tooltip cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }} content={<CustomTooltip />} /><Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={72}>{data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div></section>;
}
