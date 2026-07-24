'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Category } from '@/types/finance';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

export function useCategories(userId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!userId) { setCategories([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('display_order').order('name');
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }, [userId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { categories, loading, refresh, supabase };
}
