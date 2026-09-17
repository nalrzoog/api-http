import type { InvoiceStatus } from '../types/invoice';

export function invoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'مدفوعة':
      return 'var(--fk-green)';
    case 'مدفوعة جزئياً':
      return 'var(--fk-purple-dark)';
    case 'ملغاة':
      return '#B23A3A';
    case 'صادرة':
      return 'var(--fk-text)';
    default:
      return 'var(--fk-text-faint)';
  }
}
