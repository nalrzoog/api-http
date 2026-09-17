import { supabase } from '../lib/supabase';
import type { Product } from '../types/invoice';

const LOAD_ERROR = 'تعذر تحميل قائمة المنتجات، حاول مرة أخرى';

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name_ar', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Product[];
}
