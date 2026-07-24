'use client';

import { useTheme } from '@/context/theme-context';
import { formatCurrency } from '@/utils/finance';

interface CustomTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name?: string; value?: number | string }>;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { theme } = useTheme();
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return <div className={theme === 'dark' ? 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-xl' : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xl'}>
    <p className="font-semibold">{label ?? item.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">₹{formatCurrency(Number(item.value))}</p>
  </div>;
}
