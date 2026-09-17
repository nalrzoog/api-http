export type PriceType = 'fixed' | 'per_unit';

export interface Product {
  id: string;
  sku: string;
  name_ar: string;
  category: string;
  description_ar: string | null;
  price: number;
  price_type: PriceType;
  image_url: string | null;
  source_page: number | null;
  active: boolean;
}

export const INVOICE_STATUSES = ['مسودة', 'صادرة', 'مدفوعة جزئياً', 'مدفوعة', 'ملغاة'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  invoice_date: string;
  delivery_date: string | null;
  location: string | null;
  subtotal: number;
  discount: number;
  net_total: number;
  payment_1_amount: number;
  payment_2_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInput {
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  invoice_date: string;
  delivery_date: string | null;
  location: string | null;
  subtotal: number;
  discount: number;
  status: InvoiceStatus;
  notes: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  description_snapshot: string | null;
  image_url_snapshot: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

/** A line item as it exists in the editor, before it's saved (no id/invoice_id yet). */
export interface DraftInvoiceItem {
  key: string; // client-side only, for React list identity while editing
  product_id: string | null;
  product_name_snapshot: string;
  description_snapshot: string | null;
  image_url_snapshot: string | null;
  quantity: number;
  unit_price: number;
}

export function lineTotal(item: { quantity: number; unit_price: number }): number {
  return Math.round(item.quantity * item.unit_price * 100) / 100;
}

export function computeInvoiceTotals(items: { quantity: number; unit_price: number }[], discount: number) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const safeDiscount = Math.max(0, discount);
  const netTotal = Math.max(0, subtotal - safeDiscount);
  const payment1 = Math.round(netTotal * 0.5 * 100) / 100;
  const payment2 = Math.round((netTotal - payment1) * 100) / 100;
  return { subtotal, discount: safeDiscount, netTotal, payment1, payment2 };
}
