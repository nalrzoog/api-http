export const EVENT_TYPES = [
  'زواج',
  'ملكة',
  'خطوبة',
  'حفلة خاصة',
  'فعالية',
  'مناسبة أخرى',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const PAYMENT_STATUSES = ['مدفوع', 'مدفوع جزئياً', 'غير مدفوع'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  client_name: string;
  phone: string | null;
  event_type: EventType;
  event_date: string | null; // ISO date (YYYY-MM-DD)
  invoice_value: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  client_name: string;
  phone: string | null;
  event_type: EventType;
  event_date: string | null;
  invoice_value: number;
  paid_amount: number;
  notes: string | null;
}
