export const WORKSHOP_STATUSES = ['مسودة', 'قيد التجهيز', 'جاهزة', 'مكتملة'] as const;
export type WorkshopStatus = (typeof WORKSHOP_STATUSES)[number];

export const MATERIAL_STATUSES = ['ناقص', 'متوفر', 'تم التجهيز'] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export interface Workshop {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  workshop_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  participants_count: number | null;
  location: string | null;
  location_notes: string | null;
  internal_notes: string | null;
  status: WorkshopStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkshopInput {
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  workshop_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  participants_count: number | null;
  location: string | null;
  location_notes: string | null;
  internal_notes: string | null;
  status: WorkshopStatus;
}

export interface WorkshopMaterial {
  id: string;
  workshop_id: string;
  name_ar: string;
  name_en: string | null;
  quantity: number;
  unit: string | null;
  status: MaterialStatus;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkshopMaterialInput {
  name_ar: string;
  name_en: string | null;
  quantity: number;
  unit: string | null;
  status: MaterialStatus;
  notes: string | null;
}

export interface MaterialsSummary {
  total: number;
  prepared: number;
  available: number;
  missing: number;
  preparedOrAvailable: number;
  percentReady: number;
}

export function computeMaterialsSummary(materials: WorkshopMaterial[]): MaterialsSummary {
  const total = materials.length;
  const prepared = materials.filter((m) => m.status === 'تم التجهيز').length;
  const available = materials.filter((m) => m.status === 'متوفر').length;
  const missing = materials.filter((m) => m.status === 'ناقص').length;
  const preparedOrAvailable = prepared + available;
  const percentReady = total > 0 ? Math.round((preparedOrAvailable / total) * 100) : 0;
  return { total, prepared, available, missing, preparedOrAvailable, percentReady };
}
