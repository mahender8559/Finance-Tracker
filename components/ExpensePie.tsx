'use client';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CustomTooltip } from '@/components/CustomTooltip';
import { useTheme } from '@/context/theme-context';
import { CHART_COLORS } from '@/utils/finance';

export function ExpensePie({ data }: { data: { name: string; value: number }[] }) {
  const { theme } = useTheme(); const text = theme === 'dark' ? '#cbd5e1' : '#475569';
  const RAD = Math.PI / 180;
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // slightly outward
    const x = cx + radius * Math.cos(-midAngle * RAD);
    const y = cy + radius * Math.sin(-midAngle * RAD);
    const pct = Math.round(percent * 100);
    const labelY = y + 8; // move label slightly below midpoint
    return <text x={x} y={labelY} fill={text} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{`${pct}%`}</text>;
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-6"><h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200"><span className="h-2 w-2 rounded-full bg-indigo-500" />Expense breakdown</h2>{data.length === 0 ? <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/50">Add actual expenses to view chart</div> : <div className="h-80 w-full"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="60%" innerRadius="50%" outerRadius="80%" stroke="none" labelLine={false} label={renderLabel}>{data.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500, color: text }} /></PieChart></ResponsiveContainer></div>}</section>;
}
