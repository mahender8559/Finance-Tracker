'use client';

import type { Category, LedgerEntry, LedgerType, NewEntry } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props {
  title: string;
  type: LedgerType;
  entries: LedgerEntry[];
  categories?: Category[];
  totalEntries?: LedgerEntry[];
  draft?: NewEntry;
  editableTitle?: boolean;
  onRename?: () => void;
  onSave: (id: LedgerEntry['id'] | 'new', category: string, amount: string, type: LedgerType, targetDate?: string | null) => void;
  onDelete: (id: LedgerEntry['id'], type: LedgerType) => void;
  onDraftChange: (type: LedgerType, field: keyof NewEntry, value: string) => void;
  onDraftSave: (type: LedgerType) => void;
  onMoveToActual: (entry: LedgerEntry) => void;
}

const headerColors: Partial<Record<LedgerType, string>> = { Income: 'bg-emerald-600', 'Planned Expense': 'bg-indigo-600', 'Actual Expense': 'bg-rose-600', 'Billed Credit Card': 'bg-slate-700', 'Unbilled Credit Card': 'bg-slate-700', 'Future Purchases': 'bg-slate-700' };

export function LedgerCard({ title, type, entries, categories = [], totalEntries = entries, draft, editableTitle, onRename, onSave, onDelete, onDraftChange, onDraftSave, onMoveToActual }: Props) {
  const total = totalEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const header = headerColors[type] ?? 'bg-[#425b8f]';
  const saveDraftOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } };

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
    <div className={`${header} flex items-center justify-between px-4 py-3 text-sm font-bold tracking-wide text-white`}><span>{editableTitle ? <button onClick={onRename} className="border-b border-dashed border-white/50 pb-0.5 hover:text-slate-200" title="Click to rename bank">{title} ✎</button> : title}</span><span>₹{formatCurrency(total)}</span></div>
    <div>{entries.map((entry) => {
      const isMonthlySummary = entry.type === 'Summary'; const isReadOnly = entry.type === 'Actual Expense';
      return <div key={entry.id} className="group flex items-center gap-1 border-b border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
        {!isMonthlySummary && !isReadOnly && <button onClick={() => onDelete(entry.id, entry.type)} aria-label={`Delete ${entry.category}`} className="px-1 font-bold text-rose-400 opacity-100 transition hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100">×</button>}
        {isMonthlySummary || isReadOnly ? <span className="min-w-0 flex-1 px-2 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.category}</span> : type === 'Planned Expense' && categories.length ? <select defaultValue={entry.category} aria-label="Planned expense category" className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 dark:text-slate-200 dark:focus:bg-slate-800" onChange={(event) => onSave(entry.id, event.target.value, String(entry.amount), entry.type)}>{categories.map((category) => <option key={category.id} value={category.name}>{category.icon} {category.name}</option>)}</select> : <input type="text" defaultValue={entry.category} aria-label="Category" className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 dark:text-slate-200 dark:focus:bg-slate-800" onBlur={(event) => onSave(entry.id, event.target.value, String(entry.amount), entry.type)} />}
        {entry.type === 'Future Purchases' && <div className="flex shrink-0 items-center"><input type="date" defaultValue={entry.target_date ?? ''} title="Target purchase date" className="w-[96px] bg-transparent text-[10px] text-slate-500 outline-none dark:text-slate-400" onBlur={(event) => onSave(entry.id, entry.category, String(entry.amount), entry.type, event.target.value)} /><button onClick={() => onMoveToActual(entry)} aria-label={`Mark ${entry.category} purchased`} className="ml-1 text-lg font-bold text-emerald-500 hover:text-emerald-400">✓</button></div>}
        <div className="flex w-24 shrink-0 items-center justify-end text-sm font-semibold text-slate-600 dark:text-slate-300"><span className="mr-1 text-xs opacity-60">₹</span>{isReadOnly ? <span className="w-full px-1 text-right">{Number(entry.amount).toLocaleString('en-IN')}</span> : <input type="number" aria-label="Amount" defaultValue={entry.amount} className="w-full rounded bg-transparent px-1 py-1 text-right outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 dark:focus:bg-slate-800" onBlur={(event) => onSave(entry.id, entry.category, event.target.value, entry.type)} />}</div>
      </div>;
    })}
      {type !== 'Actual Expense' && <div className="flex items-center gap-1 bg-slate-50/80 px-4 py-2 pl-8 dark:bg-slate-800/50" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) onDraftSave(type); }}>{type === 'Planned Expense' ? <select value={draft?.category ?? ''} aria-label="New planned expense category" className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-sm text-slate-600 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 dark:text-slate-300 dark:focus:bg-slate-800" onChange={(event) => onDraftChange(type, 'category', event.target.value)}><option value="">{categories.length ? 'Select category…' : 'Create categories in Settings'}</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.icon} {category.name}</option>)}</select> : <input type="text" placeholder="Add new…" enterKeyHint="done" value={draft?.category ?? ''} className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-sm italic text-slate-600 outline-none focus:bg-white focus:not-italic focus:ring-1 focus:ring-blue-400 dark:text-slate-300 dark:focus:bg-slate-800" onChange={(event) => onDraftChange(type, 'category', event.target.value)} onKeyDown={saveDraftOnEnter} />}<div className="flex w-24 shrink-0 items-center text-slate-500"><span className="mr-1 text-xs opacity-60">₹</span><input type="number" placeholder="0.00" enterKeyHint="done" value={draft?.amount ?? ''} aria-label="New amount" className="w-full rounded bg-transparent px-1 py-1 text-right text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 dark:focus:bg-slate-800" onChange={(event) => onDraftChange(type, 'amount', event.target.value)} onKeyDown={saveDraftOnEnter} /></div></div>}
    </div>
  </section>;
}
