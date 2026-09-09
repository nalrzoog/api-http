import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { createWorkshop, deleteWorkshop, fetchWorkshops, updateWorkshop } from '../services/workshopService';
import type { Workshop, WorkshopInput } from '../types/workshop';

/** Shared workshops list — mirrors useClients: RLS-backed shared dataset,
 * kept live across every admin's open dashboard via Realtime. */
export function useWorkshops() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setWorkshops([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setWorkshops(await fetchWorkshops());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('workshops-shared-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workshops' }, () => reloadRef.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function addWorkshop(input: WorkshopInput) {
    if (!user) throw new Error('غير مصرح');
    const created = await createWorkshop(input);
    setWorkshops((prev) => [...prev, created]);
    return created;
  }

  async function editWorkshop(id: string, input: WorkshopInput) {
    const updated = await updateWorkshop(id, input);
    setWorkshops((prev) => prev.map((w) => (w.id === id ? updated : w)));
    return updated;
  }

  async function removeWorkshop(id: string) {
    await deleteWorkshop(id);
    setWorkshops((prev) => prev.filter((w) => w.id !== id));
  }

  return { workshops, loading, error, reload, addWorkshop, editWorkshop, removeWorkshop };
}
