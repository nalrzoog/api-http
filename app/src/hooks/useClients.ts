import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { createClient, deleteClient, fetchClients, updateClient } from '../services/clientService';
import type { Client, ClientInput } from '../types';

/** Single source of truth for client records, shared by the dashboard and
 * the clients page so that every add/edit/delete refreshes both — and now
 * shared across every admin's open dashboard via Realtime, since `clients`
 * is one dataset for all authorized users. */
export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchClients();
      setClients(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Any other admin's add/edit/delete on the shared `clients` table lands
  // here too — refetch so this dashboard stays live without a re-login.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('clients-shared-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        reloadRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function addClient(input: ClientInput) {
    if (!user) throw new Error('غير مصرح');
    const created = await createClient(user.id, input);
    setClients((prev) => [created, ...prev]);
    return created;
  }

  async function editClient(id: string, input: ClientInput) {
    const updated = await updateClient(id, input);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  async function removeClient(id: string) {
    await deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return { clients, loading, error, reload, addClient, editClient, removeClient };
}
