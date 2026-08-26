import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { createClient, deleteClient, fetchClients, updateClient } from '../services/clientService';
import type { Client, ClientInput } from '../types';

/** Single source of truth for client records, shared by the dashboard and
 * the clients page so that every add/edit/delete refreshes both. */
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
