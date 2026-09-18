import { useMemo, useState } from 'react';
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { useAuth } from '../hooks/useAuth';
import { useOperationsBoard } from '../hooks/useOperationsBoard';
import { useTrelloMembers } from '../hooks/useTrelloMembers';
import { createTask, moveTask, pushTaskToTrello, updateTask } from '../services/operationsService';
import { TASK_PRIORITIES } from '../types/operations';
import type { Task, TaskInput } from '../types/operations';

function Column({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 270,
        flex: '1 1 270px',
        background: isOver ? 'rgba(107,143,113,.08)' : 'transparent',
        borderRadius: 8,
        padding: 6,
        transition: 'background .15s',
      }}
    >
      {children}
    </div>
  );
}

export function OperationsBoardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { board, lists, labels, tasks, taskLabelsMap, loading, error, reload } = useOperationsBoard();
  const { members } = useTrelloMembers();

  const [modalTarget, setModalTarget] = useState<Task | 'new' | null>(null);
  const [newTaskListId, setNewTaskListId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filteredTasks = useMemo(() => {
    const q = search.trim();
    return tasks.filter((t) => {
      if (q && !t.title.includes(q) && !(t.customer_name ?? '').includes(q) && !(t.order_number ?? '').includes(q)) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && !t.trello_member_ids?.includes(assigneeFilter)) return false;
      if (labelFilter && !(taskLabelsMap[t.id] ?? []).includes(labelFilter)) return false;
      return true;
    });
  }, [tasks, search, priorityFilter, assigneeFilter, labelFilter, taskLabelsMap]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newListId = String(over.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.list_id === newListId) return;

    await moveTask(taskId, newListId);
    reload();
    pushTaskToTrello(taskId).catch(() => {});
  }

  async function handleSaveTask(input: TaskInput): Promise<Task> {
    if (modalTarget === 'new') {
      if (!board) throw new Error('اللوحة غير جاهزة بعد');
      const created = await createTask(input, profile!.id, board.id);
      reload();
      return created;
    }
    const updated = await updateTask((modalTarget as Task).id, input);
    reload();
    return updated;
  }

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>العمليات</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>لوحة إدارة الفريق</h1>
        </div>
        {isAdmin && (
          <button
            className="fk-btn-primary"
            style={{ padding: '12px 20px', fontSize: 14.5 }}
            onClick={() => { setNewTaskListId(lists[0]?.id); setModalTarget('new'); }}
            disabled={lists.length === 0}
          >
            + إضافة مهمة
          </button>
        )}
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 20px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <input className="fk-input" style={{ minWidth: 220, padding: '10px 14px' }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالعنوان، العميل أو رقم الطلب" />
        <select className="fk-input" style={{ width: 160, padding: '10px 14px' }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">كل الأولويات</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="fk-input" style={{ width: 180, padding: '10px 14px' }} value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="">كل المكلّفين</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
        </select>
        <select className="fk-input" style={{ width: 180, padding: '10px 14px' }} value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {labels.map((l) => <option key={l.id} value={l.id}>{l.name_ar}</option>)}
        </select>
        {(search || priorityFilter || assigneeFilter || labelFilter) && (
          <button className="fk-btn-link" style={{ color: 'var(--fk-purple-dark)' }} onClick={() => { setSearch(''); setPriorityFilter(''); setAssigneeFilter(''); setLabelFilter(''); }}>
            مسح الفلاتر
          </button>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="fk-card" style={{ padding: 40, textAlign: 'center', color: 'var(--fk-text-faint)' }}>
          لا توجد قوائم بعد. تأكد من إعداد لوحة Trello من صفحة إعدادات Trello.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10 }}>
            {lists.map((list) => {
              const listTasks = filteredTasks.filter((t) => t.list_id === list.id);
              return (
                <Column key={list.id} id={list.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px 12px' }}>
                    <span style={{ fontSize: 14.5 }}>{list.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--fk-text-faint)' }}>{listTasks.length}</span>
                  </div>
                  {listTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      labelIds={taskLabelsMap[t.id] ?? []}
                      labels={labels}
                      members={members}
                      onOpen={() => setModalTarget(t)}
                    />
                  ))}
                  {listTasks.length === 0 && (
                    <div style={{ padding: '20px 6px', fontSize: 12.5, color: 'var(--fk-text-faint)', textAlign: 'center' }}>لا توجد بطاقات</div>
                  )}
                </Column>
              );
            })}
          </div>
        </DndContext>
      )}

      {modalTarget && (
        <TaskModal
          task={modalTarget}
          lists={lists}
          labels={labels}
          defaultListId={newTaskListId}
          onClose={() => setModalTarget(null)}
          onSave={handleSaveTask}
          onDeleted={() => { setModalTarget(null); reload(); }}
        />
      )}
    </AppShell>
  );
}
