import { supabase } from '../lib/supabase';
import type { Client, ClientInput } from '../types';

const SAVE_ERROR = 'تعذر حفظ البيانات، حاول مرة أخرى';
const LOAD_ERROR = 'تعذر تحميل البيانات، حاول مرة أخرى';
const DELETE_ERROR = 'تعذر حذف السجل، حاول مرة أخرى';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Client[];
}

export async function createClient(userId: string, input: ClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...input, user_id: userId })
    .select('*')
    .single();

  if (error) throw new Error(SAVE_ERROR);
  return data as Client;
}

export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(SAVE_ERROR);
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}
