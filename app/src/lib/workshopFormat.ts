import type { MaterialStatus, WorkshopStatus } from '../types/workshop';

export function formatTime(value: string | null): string {
  if (!value) return '—';
  // Postgres `time` comes back as "HH:MM:SS" — show "HH:MM".
  return value.slice(0, 5);
}

export function workshopStatusColor(status: WorkshopStatus): string {
  switch (status) {
    case 'مكتملة':
      return 'var(--fk-green)';
    case 'جاهزة':
      return 'var(--fk-green)';
    case 'قيد التجهيز':
      return 'var(--fk-purple-dark)';
    default:
      return 'var(--fk-text-faint)';
  }
}

/** Material statuses reuse the common.missing/available/prepared dictionary
 * entries (workshop statuses have their own `status.*` entries instead). */
export function materialStatusKey(status: MaterialStatus): 'common.missing' | 'common.available' | 'common.prepared' {
  switch (status) {
    case 'تم التجهيز':
      return 'common.prepared';
    case 'متوفر':
      return 'common.available';
    default:
      return 'common.missing';
  }
}

export function materialStatusColor(status: MaterialStatus): string {
  switch (status) {
    case 'تم التجهيز':
      return 'var(--fk-green)';
    case 'متوفر':
      return 'var(--fk-purple-dark)';
    default:
      return '#B23A3A';
  }
}
