export const TASK_PRIORITIES = ['منخفضة', 'متوسطة', 'عالية', 'عاجلة'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const SYNC_STATUSES = ['not_synced', 'synced', 'pending', 'error'] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export interface Board {
  id: string;
  name: string;
  trello_board_id: string | null;
  created_at: string;
}

export interface TaskList {
  id: string;
  board_id: string;
  name: string;
  trello_list_id: string | null;
  position: number;
}

export interface Label {
  id: string;
  name_ar: string;
  color: string;
  trello_label_id: string | null;
}

export interface Task {
  id: string;
  board_id: string;
  list_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_number: string | null;
  wedding_client_id: string | null;
  workshop_id: string | null;
  tags: string[];
  trello_card_id: string | null;
  trello_board_id: string | null;
  trello_list_id: string | null;
  trello_member_ids: string[];
  last_synced_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  external_updated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  list_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_number: string | null;
  wedding_client_id: string | null;
  workshop_id: string | null;
  tags: string[];
  trello_member_ids: string[];
}

export interface TaskFinancials {
  task_id: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  initials: string;
}

export interface Target {
  id: string;
  target_type: 'weekly_sales' | 'monthly_sales' | 'wedding' | 'workshop' | 'new_customer' | 'marketing';
  period_start: string;
  period_end: string;
  target_amount: number;
  target_unit: 'SAR' | 'count';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyAchievement {
  id: string;
  trello_member_id: string | null;
  category: string;
  title: string;
  description: string | null;
  week_start: string;
  trello_card_id: string | null;
  created_by: string | null;
  created_at: string;
}

export type NotificationType =
  | 'task_due_today'
  | 'task_overdue'
  | 'upcoming_wedding'
  | 'upcoming_workshop'
  | 'pending_payment'
  | 'low_stock'
  | 'target_progress'
  | 'new_assigned_task'
  | 'trello_sync_error';

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_task_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SyncLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  direction: 'to_trello' | 'from_trello';
  status: 'success' | 'error';
  message: string | null;
  created_at: string;
}

export interface TrelloConnectionStatus {
  id: boolean;
  is_connected: boolean;
  board_id: string | null;
  last_tested_at: string | null;
  last_test_result: string | null;
  updated_at: string;
}
