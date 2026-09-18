import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { fetchBoard, fetchLabels, fetchTaskLabelsMap, fetchTaskLists, fetchTasks } from '../services/operationsService';
import type { Board, Label, Task, TaskList } from '../types/operations';

/** Loads the (single, real) Operations board + its lists/labels/tasks and
 * keeps them live via Realtime. RLS decides what an employee actually sees
 * (their own assigned cards) vs. an admin (everything) - this hook just
 * reflects whatever the database returns. */
export function useOperationsBoard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLabelsMap, setTaskLabelsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setBoard(null);
      setLists([]);
      setLabels([]);
      setTasks([]);
      setTaskLabelsMap({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [b, l, lb, t, tlm] = await Promise.all([fetchBoard(), fetchTaskLists(), fetchLabels(), fetchTasks(), fetchTaskLabelsMap()]);
      setBoard(b);
      setLists(l);
      setLabels(lb);
      setTasks(t);
      setTaskLabelsMap(tlm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البيانات، حاول مرة أخرى');
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
      .channel('operations-board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => reloadRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_labels' }, () => reloadRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_lists' }, () => reloadRef.current())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { board, lists, labels, tasks, taskLabelsMap, loading, error, reload };
}
