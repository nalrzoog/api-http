import { supabase } from '../lib/supabase';
import type { Workshop, WorkshopInput, WorkshopMaterial, WorkshopMaterialInput } from '../types/workshop';

const SAVE_ERROR = 'تعذر حفظ البيانات، حاول مرة أخرى';
const LOAD_ERROR = 'تعذر تحميل البيانات، حاول مرة أخرى';
const DELETE_ERROR = 'تعذر الحذف، حاول مرة أخرى';
const UPLOAD_ERROR = 'تعذر رفع الصورة، حاول مرة أخرى';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateWorkshopImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'صيغة الصورة يجب أن تكون JPG أو PNG أو WEBP';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت';
  }
  return null;
}

export async function uploadWorkshopImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('workshop-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(UPLOAD_ERROR);

  const { data } = supabase.storage.from('workshop-images').getPublicUrl(path);
  return data.publicUrl;
}

// --- Workshops ---

export async function fetchWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabase.from('workshops').select('*').order('workshop_date', { ascending: true, nullsFirst: false });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Workshop[];
}

export async function fetchWorkshop(id: string): Promise<Workshop | null> {
  const { data, error } = await supabase.from('workshops').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return data as Workshop | null;
}

export async function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  const { data, error } = await supabase.from('workshops').insert(input).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as Workshop;
}

export async function updateWorkshop(id: string, input: WorkshopInput): Promise<Workshop> {
  const { data, error } = await supabase.from('workshops').update(input).eq('id', id).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as Workshop;
}

export async function deleteWorkshop(id: string): Promise<void> {
  // workshop_materials cascades via FK on delete.
  const { error } = await supabase.from('workshops').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

// --- Materials ---

export async function fetchMaterials(workshopId: string): Promise<WorkshopMaterial[]> {
  const { data, error } = await supabase
    .from('workshop_materials')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as WorkshopMaterial[];
}

/** All materials across every workshop, for the list page's "N/M ready"
 * summaries — one query instead of one per workshop card. */
export async function fetchAllMaterials(): Promise<WorkshopMaterial[]> {
  const { data, error } = await supabase.from('workshop_materials').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as WorkshopMaterial[];
}

export async function createMaterial(workshopId: string, input: WorkshopMaterialInput, sortOrder: number): Promise<WorkshopMaterial> {
  const { data, error } = await supabase
    .from('workshop_materials')
    .insert({ ...input, workshop_id: workshopId, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) throw new Error(SAVE_ERROR);
  return data as WorkshopMaterial;
}

export async function updateMaterial(id: string, input: Partial<WorkshopMaterialInput>): Promise<WorkshopMaterial> {
  const { data, error } = await supabase.from('workshop_materials').update(input).eq('id', id).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as WorkshopMaterial;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('workshop_materials').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

export async function swapMaterialOrder(a: WorkshopMaterial, b: WorkshopMaterial): Promise<void> {
  const { error: e1 } = await supabase.from('workshop_materials').update({ sort_order: b.sort_order }).eq('id', a.id);
  const { error: e2 } = await supabase.from('workshop_materials').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (e1 || e2) throw new Error(SAVE_ERROR);
}
