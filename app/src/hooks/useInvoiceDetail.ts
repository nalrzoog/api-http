import { useEffect, useState } from 'react';
import { fetchInvoice, fetchInvoiceItems } from '../services/invoiceService';
import type { Invoice, InvoiceItem } from '../types/invoice';

/** Loads one existing invoice + its items, for the editor's edit/view mode. */
export function useInvoiceDetail(id: string | undefined) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setInvoice(null);
      setItems([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchInvoice(id), fetchInvoiceItems(id)])
      .then(([inv, its]) => {
        if (!active) return;
        setInvoice(inv);
        setItems(its);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'تعذر تحميل الفاتورة، حاول مرة أخرى');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return { invoice, items, loading, error };
}
