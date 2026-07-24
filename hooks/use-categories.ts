'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Category } from '@/types/finance';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: '🛒', color: '#10b981', display_order: 1, is_default: true },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', display_order: 2, is_default: true },
  { name: 'Eating Out', icon: '🍽️', color: '#f59e0b', display_order: 3, is_default: true },
  { name: 'Utilities', icon: '💡', color: '#6366f1', display_order: 4, is_default: true },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', display_order: 5, is_default: true },
  { name: 'Savings', icon: '💰', color: '#2563eb', display_order: 6, is_default: true },
  { name: 'Investments', icon: '📈', color: '#14b8a6', display_order: 7, is_default: true },
];

export function useCategories(userId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!userId) { setCategories([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').eq('user_id', userId).order('display_order').order('name');
    const existingCategories = (data ?? []) as Category[];
    const existingNames = new Set(existingCategories.map((category) => category.name.toLowerCase()));
    const missingDefaults = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category.name.toLowerCase()));
    if (missingDefaults.length) {
      const { error, data: inserted } = await supabase.from('categories').insert(
        missingDefaults.map((category) => ({ ...category, user_id: userId })),
      ).select();
      if (!error && inserted) {
        existingCategories.push(...(inserted as Category[]));
      }
    }
    setCategories(existingCategories);
    setLoading(false);
  }, [userId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { categories, loading, refresh, supabase };
}
