import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import {
  createMaterial,
  deleteMaterial,
  fetchMaterials,
  fetchWorkshop,
  swapMaterialOrder,
  updateMaterial,
  updateWorkshop,
} from '../services/workshopService';
import type { Workshop, WorkshopInput, WorkshopMaterial, WorkshopMaterialInput } from '../types/workshop';

/** One workshop + its materials, kept live: any other admin adding, editing,
 * reordering, or deleting a material (or editing the workshop itself) shows
 * up here immediately via Realtime. */
export function useWorkshopDetail(workshopId: string | undefined) {
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [materials, setMaterials] = useState<WorkshopMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user || !workshopId) {
      setWorkshop(null);
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [w, m] = await Promise.all([fetchWorkshop(workshopId), fetchMaterials(workshopId)]);
      setWorkshop(w);
      setMaterials(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }, [user, workshopId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (!user || !workshopId) return;
    const channel = supabase
      .channel(`workshop-detail-${workshopId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workshops', filter: `id=eq.${workshopId}` }, () => reloadRef.current())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workshop_materials', filter: `workshop_id=eq.${workshopId}` },
        () => reloadRef.current()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workshopId]);

  async function saveWorkshop(input: WorkshopInput) {
    if (!workshopId) return;
    const updated = await updateWorkshop(workshopId, input);
    setWorkshop(updated);
    return updated;
  }

  async function addMaterial(input: WorkshopMaterialInput) {
    if (!workshopId) return;
    const nextOrder = materials.length > 0 ? Math.max(...materials.map((m) => m.sort_order)) + 1 : 0;
    const created = await createMaterial(workshopId, input, nextOrder);
    setMaterials((prev) => [...prev, created]);
    return created;
  }

  async function editMaterial(id: string, input: Partial<WorkshopMaterialInput>) {
    const updated = await updateMaterial(id, input);
    setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }

  async function removeMaterial(id: string) {
    await deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  async function moveMaterial(id: string, direction: 'up' | 'down') {
    const sorted = [...materials].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((m) => m.id === id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapIndex];
    await swapMaterialOrder(a, b);
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === a.id) return { ...m, sort_order: b.sort_order };
        if (m.id === b.id) return { ...m, sort_order: a.sort_order };
        return m;
      })
    );
  }

  return {
    workshop,
    materials: [...materials].sort((a, b) => a.sort_order - b.sort_order),
    loading,
    error,
    reload,
    saveWorkshop,
    addMaterial,
    editMaterial,
    removeMaterial,
    moveMaterial,
  };
}
