'use client';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { ExpensePie } from '@/components/ExpensePie';
import { Header } from '@/components/Header';
import { LedgerCard } from '@/components/LedgerCard';
import { PlannedActualComparison } from '@/components/PlannedActualComparisonts/PlannedActualComparison';
import { SummaryCards } from '@/components/SummaryCards';
import { useCategories } from '@/hooks/use-categories';
import { useMonthOptions } from '@/hooks/use-month-options';
import type { LedgerEntry, LedgerType, NewInputs, OverallStats } from '@/types/finance';
import { formatCurrency, getOrdinal, sumEntries } from '@/utils/finance';

type DashboardTransaction = {
  amount: number | string;
  category?: { name: string } | null;
};
type DashboardTransactionRaw = {
  amount: number | string;
  category?: { name: string } | { name: string }[] | null;
};

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
const summaryFallback = (category: string): LedgerEntry => ({ id: 'new', month: '', category, amount: 0, type: 'Summary' });

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null); const [isInitializing, setIsInitializing] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [isLogin, setIsLogin] = useState(true); const [authLoading, setAuthLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('July 2026'); const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]); const [transactionData, setTransactionData] = useState<DashboardTransaction[]>([]); const [dataLoading, setDataLoading] = useState(false); const [newInputs, setNewInputs] = useState<NewInputs>({}); const [overallStats, setOverallStats] = useState<OverallStats>({ investments: 0, savings: 0 }); const [bankName, setBankName] = useState('Loading Bank...'); const [showBankBreakdown, setShowBankBreakdown] = useState(false); const [ccBillingDay, setCcBillingDay] = useState(15); const [ccDueDay, setCcDueDay] = useState(5);
  const { categories } = useCategories(session?.user.id);
  const monthOptions = useMonthOptions();
  const ccDueDateString = useMemo(() => { const date = new Date(`${selectedMonth} 1`); if (ccDueDay < ccBillingDay) date.setMonth(date.getMonth() + 1); return `${getOrdinal(ccDueDay)} ${date.toLocaleString('en-US', { month: 'short' })}`; }, [selectedMonth, ccBillingDay, ccDueDay]);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setIsInitializing(false); }); const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession)); return () => subscription.unsubscribe(); }, []);
  const fetchSettings = useCallback(async () => { if (!session) return; const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single(); if (data) { setBankName(data.bank_name); setShowBankBreakdown(data.show_bank_breakdown); setCcBillingDay(data.cc_billing_day || 15); setCcDueDay(data.cc_due_day || 5); } else { await supabase.from('user_settings').insert([{ user_id: session.user.id, bank_name: 'IDFC Account Breakdown', show_bank_breakdown: false, cc_billing_day: 15, cc_due_day: 5 }]); setBankName('IDFC Account Breakdown'); } }, [session]);
  const fetchData = useCallback(async (month: string) => { if (!session) return; setDataLoading(true); setLedgerData([]); const [{ data: monthly }, { data: future }] = await Promise.all([supabase.from('ledger').select('*').eq('user_id', session.user.id).eq('month', month).neq('type', 'Future Purchases'), supabase.from('ledger').select('*').eq('user_id', session.user.id).eq('type', 'Future Purchases')]); const monthEntries = (monthly ?? []) as LedgerEntry[]; const existingSummaryCategories = new Set(monthEntries.filter((entry) => entry.type === 'Summary').map((entry) => entry.category)); const missingSummaryEntries = ['Investments', 'Savings'].filter((category) => !existingSummaryCategories.has(category)).map((category) => ({ month, category, amount: 0, type: 'Summary', user_id: session.user.id })); const { data: createdSummaries } = missingSummaryEntries.length ? await supabase.from('ledger').insert(missingSummaryEntries).select() : { data: [] }; setLedgerData([...monthEntries, ...((createdSummaries ?? []) as LedgerEntry[]), ...((future ?? []) as LedgerEntry[])]); setDataLoading(false); }, [session]);
  const fetchOverallStats = useCallback(async () => {
    if (!session) return;
    const [{ data: summaryData }, { data: transactionData }] = await Promise.all([
      supabase.from('ledger').select('category, amount').eq('type', 'Summary').eq('user_id', session.user.id),
      supabase.from('transactions').select('amount, category:categories(name)').eq('user_id', session.user.id).eq('transaction_type', 'Actual Expense'),
    ]);

    const summaryInvestments = (summaryData ?? []).filter((item) => item.category === 'Investments').reduce((sum, item) => sum + Number(item.amount), 0);
    const summarySavings = (summaryData ?? []).filter((item) => item.category === 'Savings').reduce((sum, item) => sum + Number(item.amount), 0);
    const normalizedTransactions = (transactionData ?? []) as DashboardTransactionRaw[];
    const isCategoryArray = (category: DashboardTransactionRaw['category']): category is { name: string }[] => Array.isArray(category);
    const transactionTotals = normalizedTransactions.reduce(
      (acc, item) => {
        const category = isCategoryArray(item.category) ? item.category[0]?.name : item.category?.name;
        if (category === 'Investments') acc.investments += Number(item.amount);
        if (category === 'Savings') acc.savings += Number(item.amount);
        return acc;
      },
      { investments: 0, savings: 0 },
    );

    setOverallStats({
      investments: summaryInvestments + transactionTotals.investments,
      savings: summarySavings + transactionTotals.savings,
    });
  }, [session]);
  const fetchTransactions = useCallback(async (month: string) => {
    if (!session) return;
    const { data, error } = await supabase.from('transactions').select('amount, category:categories(name)').eq('user_id', session.user.id).eq('month', month).eq('transaction_type', 'Actual Expense');
    if (error) {
      alert(error.message);
      return;
    }
    const normalized = (data ?? []) as DashboardTransactionRaw[];
    setTransactionData(normalized.map((item) => ({ amount: item.amount, category: Array.isArray(item.category) ? item.category[0] ?? null : item.category ?? null })));
    void fetchOverallStats();
  }, [session, fetchOverallStats]);
  useEffect(() => { if (session) { void fetchData(selectedMonth); void fetchOverallStats(); void fetchSettings(); void fetchTransactions(selectedMonth); } }, [selectedMonth, session, fetchData, fetchOverallStats, fetchSettings, fetchTransactions]);
  async function handleSave(id: LedgerEntry['id'] | 'new', category: string, amount: string, type: LedgerType, targetDate: string | null = null) { if (!category.trim() && !amount && id === 'new') return; const payload = { month: selectedMonth, category, amount: parseFloat(amount) || 0, type, ...(targetDate !== null ? { target_date: targetDate || null } : {}) }; if (id === 'new') { const { data, error } = await supabase.from('ledger').insert([{ ...payload, user_id: session?.user.id }]).select(); if (error) return alert(`SUPABASE ERROR: ${error.message}`); if (data?.[0]) setLedgerData((current) => [...current, data[0] as LedgerEntry]); } else { const { error } = await supabase.from('ledger').update(payload).eq('id', id); if (error) alert(`UPDATE ERROR: ${error.message}`); else setLedgerData((current) => current.map((item) => item.id === id ? { ...item, ...payload } : item)); } if (type === 'Summary') void fetchOverallStats(); }
  async function handleDelete(id: LedgerEntry['id'], type: LedgerType) { if (!confirm('Are you sure you want to delete this entry?')) return; const { error } = await supabase.from('ledger').delete().eq('id', id); if (error) alert(`Error deleting: ${error.message}`); else { setLedgerData((current) => current.filter((item) => item.id !== id)); if (type === 'Summary') void fetchOverallStats(); } }
  async function handleNewSave(type: LedgerType) { const draft = newInputs[type]; if (!draft || (!draft.category.trim() && !draft.amount)) return; if (type === 'Planned Expense' && ledgerData.some((item) => item.type === 'Planned Expense' && item.category.toLowerCase() === draft.category.trim().toLowerCase())) { alert('Each category can have only one planned budget per month.'); return; } await handleSave('new', draft.category, draft.amount, type); setNewInputs((current) => ({ ...current, [type]: { category: '', amount: '' } })); }
  async function moveToActual(item: LedgerEntry) { if (!confirm(`Mark "${item.category}" as purchased and move it to this month's Actual Expenses?`)) return; const { error } = await supabase.from('ledger').update({ type: 'Actual Expense', month: selectedMonth }).eq('id', item.id); if (error) alert(`Error moving: ${error.message}`); else setLedgerData((current) => current.map((entry) => entry.id === item.id ? { ...entry, type: 'Actual Expense', month: selectedMonth } : entry)); }
  async function handleRollover() { if (!confirm("Copy 'Income' and 'Planned Expenses' categories from the previous month? (Amounts will be set to ₹0)")) return; const prior = new Date(`${selectedMonth} 1`); prior.setMonth(prior.getMonth() - 1); const previousMonth = prior.toLocaleString('en-US', { month: 'long', year: 'numeric' }); const { data } = await supabase.from('ledger').select('category, type').eq('month', previousMonth).in('type', ['Income', 'Planned Expense']); if (!data?.length) return alert(`No Income or Planned Expenses found in ${previousMonth}.`); const categories = new Set(ledgerData.map((item) => item.category.toLowerCase())); const additions = data.filter((item) => !categories.has(item.category.toLowerCase())).map((item) => ({ month: selectedMonth, category: item.category, amount: 0, type: item.type, user_id: session?.user.id })); if (!additions.length) return alert('All categories from the previous month already exist in this month.'); const { data: inserted, error } = await supabase.from('ledger').insert(additions).select(); if (error) alert(`Error copying: ${error.message}`); else if (inserted) { setLedgerData((current) => [...current, ...(inserted as LedgerEntry[])]); alert(`Successfully copied ${inserted.length} categories!`); } }
  async function handleRenameBank() { const name = prompt('Enter your bank name:', bankName); if (!name?.trim() || !session) return; setBankName(name); const { error } = await supabase.from('user_settings').update({ bank_name: name }).eq('user_id', session.user.id); if (error) await supabase.from('user_settings').upsert([{ user_id: session.user.id, bank_name: name }]); }
  async function handleCcSettings() { const billing = prompt('Enter your Credit Card Billing Date (e.g., 15):', String(ccBillingDay)); const due = prompt('Enter your Credit Card Due Date (e.g., 5):', String(ccDueDay)); if (!billing || !due || Number.isNaN(Number(billing)) || Number.isNaN(Number(due)) || !session) return; const cc_billing_day = parseInt(billing); const cc_due_day = parseInt(due); setCcBillingDay(cc_billing_day); setCcDueDay(cc_due_day); await supabase.from('user_settings').update({ cc_billing_day, cc_due_day }).eq('user_id', session.user.id); }
  async function handleAuth(event: FormEvent) { event.preventDefault(); setAuthLoading(true); const { error } = isLogin ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); if (error) alert(`${isLogin ? 'Login' : 'Signup'} failed: ${error.message}`); else if (!isLogin) alert('Account created successfully! Logging you in...'); setAuthLoading(false); }
  async function handleSignOut() { await supabase.auth.signOut(); setLedgerData([]); setOverallStats({ investments: 0, savings: 0 }); setBankName('Loading Bank...'); setShowBankBreakdown(false); }
  const incomeTotal = sumEntries(ledgerData, 'Income');
  const billedTotal = sumEntries(ledgerData, 'Billed Credit Card');
  const unbilledTotal = sumEntries(ledgerData, 'Unbilled Credit Card');
  const transactionLedgerEntries = transactionData
    .filter((transaction) => Number(transaction.amount) > 0)
    .reduce<Record<string, LedgerEntry>>((acc, transaction, index) => {
      const categoryName = transaction.category?.name ?? 'Other';
      const amount = Number(transaction.amount);
      if (!acc[categoryName]) {
        acc[categoryName] = {
          id: `tx-${categoryName}-${index}`,
          month: selectedMonth,
          category: categoryName,
          amount,
          type: 'Actual Expense',
        };
      } else {
        acc[categoryName].amount = Number(acc[categoryName].amount) + amount;
      }
      return acc;
    }, {});
  const investment = ledgerData.find((item) => item.type === 'Summary' && item.category === 'Investments') ?? summaryFallback('Investments');
  const savings = ledgerData.find((item) => item.type === 'Summary' && item.category === 'Savings') ?? summaryFallback('Savings');
  const actualEntries = ledgerData.filter((item) => item.type === 'Actual Expense');
  const actualTransactionEntries = Object.values(transactionLedgerEntries);
  const actualEntriesCombinedByCategory = [...actualEntries, ...actualTransactionEntries].reduce<Record<string, LedgerEntry>>((acc, entry, index) => {
    const categoryName = entry.category || 'Other';
    const amount = Number(entry.amount);
    if (!acc[categoryName]) {
      acc[categoryName] = {
        id: `actual-${categoryName}-${index}`,
        month: selectedMonth,
        category: categoryName,
        amount,
        type: 'Actual Expense',
      };
    } else {
      acc[categoryName].amount = Number(acc[categoryName].amount) + amount;
    }
    return acc;
  }, {});
  const actualLedgerEntries = Object.values(actualEntriesCombinedByCategory);
  const actualExpenseEntries = actualLedgerEntries.filter((entry) => entry.category !== 'Savings' && entry.category !== 'Investments');
  const savingsCategoryEntry = actualLedgerEntries.find((entry) => entry.category === 'Savings');
  const investmentCategoryEntry = actualLedgerEntries.find((entry) => entry.category === 'Investments');
  const investmentSummary = { ...investment, amount: Number(investment.amount) + Number(investmentCategoryEntry?.amount ?? 0) } as LedgerEntry;
  const savingsSummary = { ...savings, amount: Number(savings.amount) + Number(savingsCategoryEntry?.amount ?? 0) } as LedgerEntry;
  const actualTotal = actualExpenseEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalOutflow = actualTotal + Number(investmentSummary.amount) + Number(savingsSummary.amount);
  const pieData = actualLedgerEntries.map((item) => ({ name: item.category, value: Number(item.amount) }));
  const plannedByCategory = ledgerData
    .filter((item) => item.type === 'Planned Expense')
    .reduce<Record<string, number>>((acc, item) => {
      const category = item.category || 'Other';
      acc[category] = (acc[category] ?? 0) + Number(item.amount);
      return acc;
    }, {});

  const actualByCategory = actualExpenseEntries.reduce<Record<string, number>>((acc, item) => {
    const category = item.category || 'Other';
    acc[category] = (acc[category] ?? 0) + Number(item.amount);
    return acc;
  }, {});

  const plannedActualData = [...new Set([...Object.keys(plannedByCategory), ...Object.keys(actualByCategory)])].map((category) => ({
    category,
    planned: plannedByCategory[category] ?? 0,
    actual: actualByCategory[category] ?? 0,
  }));

  const draftChange = (type: LedgerType, field: 'category' | 'amount', value: string) => setNewInputs((current) => ({ ...current, [type]: { category: current[type]?.category ?? '', amount: current[type]?.amount ?? '', [field]: value } })); const card = (title: string, type: LedgerType, editableTitle = false, entries = ledgerData.filter((item) => item.type === type), totalEntries = entries) => <LedgerCard title={title} type={type} entries={entries} categories={categories} totalEntries={totalEntries} draft={newInputs[type]} editableTitle={editableTitle} onRename={handleRenameBank} onSave={handleSave} onDelete={handleDelete} onDraftChange={draftChange} onDraftSave={handleNewSave} onMoveToActual={moveToActual} />;
  if (isInitializing) return <main className="flex min-h-screen items-center justify-center bg-slate-50 font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading…</main>;
  if (!session) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950"><div className="w-full max-w-md rounded-xl border-t-8 border-[#425b8f] bg-white p-7 shadow-lg dark:bg-slate-900"><h1 className="mb-6 text-center text-2xl font-black text-slate-800 dark:text-slate-100">{isLogin ? 'Welcome Back' : 'Create an Account'}</h1><form onSubmit={handleAuth} className="space-y-4">{[['email', 'Email address'], ['password', 'Password']].map(([type, label]) => <label key={type} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}<input type={type} required value={type === 'email' ? email : password} onChange={(event) => type === 'email' ? setEmail(event.target.value) : setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>)}<button disabled={authLoading} className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50">{authLoading ? 'Processing…' : isLogin ? 'Login to Dashboard' : 'Sign Up'}</button></form><button onClick={() => setIsLogin((current) => !current)} className="mt-6 w-full text-sm font-semibold text-blue-600 hover:text-blue-500">{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}</button></div></main>;
  return <main className="min-h-screen bg-slate-50 p-3 dark:bg-slate-950 sm:p-5 lg:p-6"><div className="mx-auto max-w-7xl"><Header selectedMonth={selectedMonth} months={monthOptions} onMonthChange={setSelectedMonth} onRollover={handleRollover} onSignOut={handleSignOut} /><SummaryCards expenses={actualTotal} income={incomeTotal} investments={investmentSummary} savings={savingsSummary} stats={overallStats} netFlow={incomeTotal - totalOutflow} /><div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3 md:mb-8"><ExpensePie data={pieData} /><PlannedActualComparison data={plannedActualData} className="xl:col-span-2" /></div>{dataLoading ? <div className="my-16 text-center text-lg font-bold text-indigo-500 animate-pulse">Syncing with ledger…</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3"><div className="space-y-4 rounded-xl bg-blue-50/60 p-2 dark:bg-blue-950/20">{card('Income', 'Income')}{showBankBreakdown && card(bankName, 'IDFC Breakdown', true)}</div><div className="rounded-xl bg-indigo-50/60 p-2 dark:bg-indigo-950/20">{card('Planned Expenses', 'Planned Expense')}</div><div className="rounded-xl bg-rose-50/60 p-2 dark:bg-rose-950/20">{card('Actual Expenses', 'Actual Expense', false, actualExpenseEntries, actualExpenseEntries)}</div><div className="space-y-4 rounded-xl bg-slate-100/70 p-2 dark:bg-slate-900/60">{card('Future Purchases', 'Future Purchases')}<div className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow-lg"><button onClick={handleCcSettings} className="border-b border-dashed border-white/40 pb-0.5 hover:text-blue-300">💳 Total CC Debt ✎</button><span className="text-rose-300">₹{formatCurrency(billedTotal + unbilledTotal)}</span></div>{card(`Billed (Due ${ccDueDateString})`, 'Billed Credit Card')}{card('Unbilled Credit Card', 'Unbilled Credit Card')}</div></div>}</div></main>;
}
