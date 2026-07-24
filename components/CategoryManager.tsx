'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/types/finance';

interface Props { userId: string; categories: Category[]; onRefresh: () => Promise<void>; supabase: SupabaseClient; }
const categoryColors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'];
const defaultCategory = { name: '', icon: '📦' };

export function CategoryManager({ userId, categories, onRefresh, supabase }: Props) {
  const [draft, setDraft] = useState(defaultCategory);
  const [saving, setSaving] = useState(false);

  const nextColor = categoryColors.find((color) => !categories.some((category) => category.color === color)) ?? categoryColors[categories.length % categoryColors.length];

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').insert([{ ...draft, user_id: userId, color: nextColor, name: draft.name.trim() }]);
    if (error) alert(error.message);
    else {
      setDraft(defaultCategory);
      await onRefresh();
    }
    setSaving(false);
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(patch).eq('id', id);
    if (error) alert(error.message);
    else await onRefresh();
  };

  const deleteCategory = async (category: Category) => {
    if (!confirm(`Delete ${category.name}? Transactions will be retained without a category.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', category.id);
    if (error) alert(error.message);
    else await onRefresh();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Categories</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Colors are assigned automatically to new categories. Categories are shared by transaction entry, budgets, filters, and charts.</p>
      </div>

      <form onSubmit={addCategory} className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-[72px_1fr_auto]">
        <input
          value={draft.icon}
          maxLength={4}
          aria-label="Category icon"
          onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          value={draft.name}
          placeholder="New category name"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">Add category</button>
      </form>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="grid items-center gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-[12px_54px_1fr_auto]">
            <span className="h-8 w-2 rounded-full" style={{ backgroundColor: category.color }} />

            <input
              defaultValue={category.icon}
              maxLength={4}
              aria-label={`${category.name} icon`}
              onBlur={(event) => {
                if (event.target.value !== category.icon) void updateCategory(category.id, { icon: event.target.value });
              }}
              className="rounded-lg bg-slate-100 p-2 text-center dark:bg-slate-800"
            />

            <input
              defaultValue={category.name}
              aria-label="Category name"
              onBlur={(event) => {
                if (event.target.value.trim() && event.target.value !== category.name) void updateCategory(category.id, { name: event.target.value.trim() });
              }}
              className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            />

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => deleteCategory(category)} className="text-sm font-medium text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

