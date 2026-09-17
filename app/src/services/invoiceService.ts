import { supabase } from '../lib/supabase';
import type { DraftInvoiceItem, Invoice, InvoiceInput, InvoiceItem } from '../types/invoice';

const SAVE_ERROR = 'تعذر حفظ الفاتورة، حاول مرة أخرى';
const LOAD_ERROR = 'تعذر تحميل الفواتير، حاول مرة أخرى';
const DELETE_ERROR = 'تعذر حذف الفاتورة، حاول مرة أخرى';
const NUMBER_ERROR = 'تعذر إصدار رقم الفاتورة، حاول مرة أخرى';

export async function reserveNextInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_invoice_number');
  if (error) throw new Error(NUMBER_ERROR);
  return data as string;
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Invoice[];
}

export async function fetchInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return data as Invoice | null;
}

export async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as InvoiceItem[];
}

function toItemRows(invoiceId: string, items: DraftInvoiceItem[]) {
  return items.map((item, index) => ({
    invoice_id: invoiceId,
    product_id: item.product_id,
    product_name_snapshot: item.product_name_snapshot,
    description_snapshot: item.description_snapshot,
    image_url_snapshot: item.image_url_snapshot,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: index,
  }));
}

/** Creates the invoice, then its items. If the items insert fails, the
 * invoice row is removed rather than left behind with zero items. */
export async function createInvoice(invoiceNumber: string, input: InvoiceInput, items: DraftInvoiceItem[]): Promise<Invoice> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({ ...input, invoice_number: invoiceNumber })
    .select('*')
    .single();
  if (invoiceError) throw new Error(SAVE_ERROR);

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(toItemRows(invoice.id, items));
    if (itemsError) {
      await supabase.from('invoices').delete().eq('id', invoice.id);
      throw new Error(SAVE_ERROR);
    }
  }

  return invoice as Invoice;
}

/** Updates the invoice fields and replaces its full item list (the editor
 * always holds the complete set, so a full replace is simplest and safe). */
export async function updateInvoice(id: string, input: InvoiceInput, items: DraftInvoiceItem[]): Promise<Invoice> {
  const { data: invoice, error: invoiceError } = await supabase.from('invoices').update(input).eq('id', id).select('*').single();
  if (invoiceError) throw new Error(SAVE_ERROR);

  const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
  if (deleteError) throw new Error(SAVE_ERROR);

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_items').insert(toItemRows(id, items));
    if (itemsError) throw new Error(SAVE_ERROR);
  }

  return invoice as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  // invoice_items cascades via FK.
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}
