import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';
import type {
  AppNotification,
  Board,
  Label,
  SyncLog,
  Target,
  Task,
  TaskChecklistItem,
  TaskComment,
  TaskFinancials,
  TaskInput,
  TaskList,
  TrelloConnectionStatus,
  TrelloMember,
  WeeklyAchievement,
} from '../types/operations';

const LOAD_ERROR = 'تعذر تحميل البيانات، حاول مرة أخرى';
const SAVE_ERROR = 'تعذر حفظ البيانات، حاول مرة أخرى';
const DELETE_ERROR = 'تعذر الحذف، حاول مرة أخرى';

/** Calls a Supabase Edge Function and surfaces the JSON `error`/`message`
 * fields our functions return on failure, instead of a generic network error. */
async function invokeEdge<T = unknown>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message || 'تعذر الاتصال بالخادم، حاول مرة أخرى';
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = await ctx.clone().json();
        message = parsed.message || parsed.error || message;
      } catch {
        // response wasn't JSON - keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

// ---------- Board / lists / labels ----------

export async function fetchBoard(): Promise<Board | null> {
  const { data, error } = await supabase.from('boards').select('*').limit(1).maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return data as Board | null;
}

export async function fetchTaskLists(): Promise<TaskList[]> {
  const { data, error } = await supabase.from('task_lists').select('*').order('position', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as TaskList[];
}

export async function fetchLabels(): Promise<Label[]> {
  const { data, error } = await supabase.from('labels').select('*').order('name_ar', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Label[];
}

// ---------- Tasks ----------

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Task[];
}

export async function createTask(input: TaskInput, createdBy: string, boardId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...input, board_id: boardId, created_by: createdBy })
    .select('*')
    .single();
  if (error) throw new Error(SAVE_ERROR);
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(input).eq('id', id).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as Task;
}

export async function moveTask(id: string, listId: string): Promise<void> {
  const { error } = await supabase.from('tasks').update({ list_id: listId }).eq('id', id);
  if (error) throw new Error(SAVE_ERROR);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

export async function fetchTaskLabelIds(taskId: string): Promise<string[]> {
  const { data, error } = await supabase.from('task_labels').select('label_id').eq('task_id', taskId);
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []).map((r) => r.label_id as string);
}

/** All task->label links on the board, as a map for fast per-card lookup
 * (avoids one query per card when rendering the Kanban board). */
export async function fetchTaskLabelsMap(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from('task_labels').select('task_id, label_id');
  if (error) throw new Error(LOAD_ERROR);
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const taskId = row.task_id as string;
    (map[taskId] ??= []).push(row.label_id as string);
  }
  return map;
}

export async function setTaskLabels(taskId: string, labelIds: string[]): Promise<void> {
  const { error: delError } = await supabase.from('task_labels').delete().eq('task_id', taskId);
  if (delError) throw new Error(SAVE_ERROR);
  if (labelIds.length === 0) return;
  const { error } = await supabase.from('task_labels').insert(labelIds.map((label_id) => ({ task_id: taskId, label_id })));
  if (error) throw new Error(SAVE_ERROR);
}

// ---------- Task financials (admin-only, enforced by RLS) ----------

export async function fetchTaskFinancials(taskId: string): Promise<TaskFinancials | null> {
  const { data, error } = await supabase.from('task_financials').select('*').eq('task_id', taskId).maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return data as TaskFinancials | null;
}

export async function upsertTaskFinancials(taskId: string, revenue: number, cost: number): Promise<void> {
  const { error } = await supabase.from('task_financials').upsert({ task_id: taskId, revenue, cost });
  if (error) throw new Error(SAVE_ERROR);
}

// ---------- Checklist ----------

export async function fetchChecklistItems(taskId: string): Promise<TaskChecklistItem[]> {
  const { data, error } = await supabase.from('task_checklist_items').select('*').eq('task_id', taskId).order('sort_order', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as TaskChecklistItem[];
}

export async function addChecklistItem(taskId: string, title: string, sortOrder: number): Promise<TaskChecklistItem> {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .insert({ task_id: taskId, title, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) throw new Error(SAVE_ERROR);
  return data as TaskChecklistItem;
}

export async function toggleChecklistItem(id: string, isDone: boolean): Promise<void> {
  const { error } = await supabase.from('task_checklist_items').update({ is_done: isDone }).eq('id', id);
  if (error) throw new Error(SAVE_ERROR);
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from('task_checklist_items').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

// ---------- Comments ----------

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as TaskComment[];
}

export async function addComment(taskId: string, authorId: string, body: string): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: authorId, body })
    .select('*')
    .single();
  if (error) throw new Error(SAVE_ERROR);
  return data as TaskComment;
}

// ---------- Targets ----------

export async function fetchTargets(): Promise<Target[]> {
  const { data, error } = await supabase.from('targets').select('*').order('period_start', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Target[];
}

export async function createTarget(input: Omit<Target, 'id' | 'created_by' | 'created_at' | 'updated_at'>, createdBy: string): Promise<Target> {
  const { data, error } = await supabase.from('targets').insert({ ...input, created_by: createdBy }).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as Target;
}

export async function deleteTarget(id: string): Promise<void> {
  const { error } = await supabase.from('targets').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

// ---------- Weekly achievements ----------

export async function fetchWeeklyAchievements(): Promise<WeeklyAchievement[]> {
  const { data, error } = await supabase.from('weekly_achievements').select('*').order('week_start', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as WeeklyAchievement[];
}

export async function createWeeklyAchievement(
  input: Omit<WeeklyAchievement, 'id' | 'created_by' | 'created_at'>,
  createdBy: string
): Promise<WeeklyAchievement> {
  const { data, error } = await supabase.from('weekly_achievements').insert({ ...input, created_by: createdBy }).select('*').single();
  if (error) throw new Error(SAVE_ERROR);
  return data as WeeklyAchievement;
}

export async function deleteWeeklyAchievement(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_achievements').delete().eq('id', id);
  if (error) throw new Error(DELETE_ERROR);
}

// ---------- Notifications ----------

export async function fetchMyNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(SAVE_ERROR);
}

// ---------- Profiles (team linking) ----------

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(id: string, role: Role): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw new Error(SAVE_ERROR);
}

export async function updateProfileTrelloLink(id: string, trelloMemberId: string | null): Promise<void> {
  const { error } = await supabase.from('profiles').update({ trello_member_id: trelloMemberId }).eq('id', id);
  if (error) throw new Error(SAVE_ERROR);
}

// ---------- Trello connection (admin) ----------

export async function fetchTrelloConnectionStatus(): Promise<TrelloConnectionStatus | null> {
  const { data, error } = await supabase.from('trello_connection_status').select('*').maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return data as TrelloConnectionStatus | null;
}

export async function fetchRecentSyncLogs(limit = 20): Promise<SyncLog[]> {
  const { data, error } = await supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(LOAD_ERROR);
  return (data ?? []) as SyncLog[];
}

export function saveTrelloCredentials(input: { api_key: string; token: string; api_secret: string; board_id: string }) {
  return invokeEdge<{ ok: true }>('trello-credentials', { action: 'save', ...input });
}

export function testTrelloConnection() {
  return invokeEdge<{ ok: boolean; message: string }>('trello-credentials', { action: 'test' });
}

export function listBoardMembers() {
  return invokeEdge<{ ok: true; members: TrelloMember[] }>('trello-sync', { action: 'list_board_members' });
}

export function pushTaskToTrello(taskId: string) {
  return invokeEdge<{ ok: true; trello_card_id: string }>('trello-sync', { action: 'push_task', task_id: taskId });
}

export function archiveTaskInTrello(taskId: string) {
  return invokeEdge<{ ok: true }>('trello-sync', { action: 'archive_task', task_id: taskId });
}

export function syncBoardStructure() {
  return invokeEdge<{ ok: true; lists: number; labels: number }>('trello-sync', { action: 'sync_board_structure' });
}

export function pullBoardFromTrello() {
  return invokeEdge<{ ok: true; created: number; updated: number; skipped: number }>('trello-sync', { action: 'pull_board' });
}

export function registerTrelloWebhook() {
  return invokeEdge<{ ok: true; webhook_id: string; callback_url: string }>('trello-sync', { action: 'register_webhook' });
}
