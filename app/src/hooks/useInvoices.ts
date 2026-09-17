import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { deleteInvoice, fetchInvoices } from '../services/invoiceService';
import type { Invoice } from '../types/invoice';

/** Shared invoices list — same pattern as useClients/useWorkshops: RLS-backed
 * shared dataset, kept live across every admin's open dashboard via Realtime. */
export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setInvoices(await fetchInvoices());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الفواتير، حاول مرة أخرى');
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
      .channel('invoices-shared-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => reloadRef.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function removeInvoice(id: string) {
    await deleteInvoice(id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }

  return { invoices, loading, error, reload, removeInvoice };
}
