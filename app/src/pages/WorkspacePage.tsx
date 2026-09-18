import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { TaskModal } from '../components/TaskModal';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useOperationsBoard } from '../hooks/useOperationsBoard';
import { fetchTargets, fetchWeeklyAchievements, updateTask } from '../services/operationsService';
import { formatDate, formatMoney } from '../lib/format';
import type { Target, Task, TaskInput, WeeklyAchievement } from '../types/operations';

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function WorkspacePage() {
  const { profile } = useAuth();
  const { lists, labels, tasks, loading, reload } = useOperationsBoard();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [achievements, setAchievements] = useState<WeeklyAchievement[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [modalTask, setModalTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchWeeklyAchievements().then(setAchievements).catch(() => {});
    fetchTargets().then(setTargets).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek();

  const dueToday = useMemo(() => tasks.filter((t) => t.due_date === today), [tasks, today]);
  const upcoming = useMemo(
    () => tasks.filter((t) => t.due_date && t.due_date > today).sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1)).slice(0, 8),
    [tasks, today]
  );
  const inProgressList = lists.find((l) => l.name.includes('التنفيذ') || l.name.toLowerCase().includes('progress'));
  const inProgress = useMemo(() => (inProgressList ? tasks.filter((t) => t.list_id === inProgressList.id) : []), [tasks, inProgressList]);

  const myAchievements = useMemo(
    () => achievements.filter((a) => a.trello_member_id && a.trello_member_id === profile?.trello_member_id && a.week_start >= weekStart),
    [achievements, profile, weekStart]
  );

  const activeTargets = useMemo(() => targets.filter((t) => t.period_end >= today), [targets, today]);

  async function handleSaveTask(input: TaskInput): Promise<Task> {
    if (!modalTask) throw new Error('لا توجد مهمة محددة');
    const updated = await updateTask(modalTask.id, input);
    reload();
    return updated;
  }

  if (loading) return <FullPageSpinner />;

  const displayName = profile?.full_name?.split(' ')[0] || profile?.full_name || 'بك';

  return (
    <AppShell>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>مساحتي</div>
        <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>مرحباً {displayName}</h1>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {!profile?.trello_member_id && (
        <div style={{ marginBottom: 20, padding: '14px 18px', border: '1px solid var(--fk-purple)', background: 'rgba(178,166,192,.1)', borderRadius: 6, fontSize: 13.5, lineHeight: 1.8 }}>
          حسابك غير مرتبط بعد بعضو في فريق Trello، لذلك لن تظهر لك مهام مخصصة. يرجى مراجعة المدير لربط الحساب.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>مهام اليوم</h3>
          {dueToday.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد مهام مستحقة اليوم.</div>}
          {dueToday.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={() => setModalTask(t)} />
          ))}
        </section>

        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>المهام القادمة</h3>
          {upcoming.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد مهام قادمة.</div>}
          {upcoming.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={() => setModalTask(t)} showDate />
          ))}
        </section>

        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>قيد التنفيذ</h3>
          {inProgress.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد مهام قيد التنفيذ حالياً.</div>}
          {inProgress.map((t) => (
            <TaskRow key={t.id} task={t} onOpen={() => setModalTask(t)} />
          ))}
        </section>

        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>إنجازاتي هذا الأسبوع</h3>
          {myAchievements.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد إنجازات مسجّلة هذا الأسبوع بعد.</div>}
          {myAchievements.map((a) => (
            <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--fk-border-faint)' }}>
              <div style={{ fontSize: 13.5 }}>{a.title}</div>
              {a.description && <div style={{ fontSize: 12, color: 'var(--fk-text-faint)', marginTop: 2 }}>{a.description}</div>}
            </div>
          ))}
        </section>

        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>التارقت</h3>
          {activeTargets.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد أهداف نشطة حالياً.</div>}
          {activeTargets.map((tg) => (
            <div key={tg.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--fk-border-faint)', display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span>{tg.notes || tg.target_type}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{tg.target_unit === 'SAR' ? formatMoney(tg.target_amount) : tg.target_amount}</span>
            </div>
          ))}
        </section>

        <section className="fk-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: '0 0 14px' }}>
            التنبيهات {unreadCount > 0 && <span style={{ fontSize: 12, color: 'var(--fk-purple-dark)' }}>({unreadCount})</span>}
          </h3>
          {notifications.length === 0 && <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد تنبيهات.</div>}
          {notifications.slice(0, 8).map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{ padding: '8px 0', borderBottom: '1px solid var(--fk-border-faint)', cursor: n.is_read ? 'default' : 'pointer', opacity: n.is_read ? 0.6 : 1 }}
            >
              <div style={{ fontSize: 13.5 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 12, color: 'var(--fk-text-faint)', marginTop: 2 }}>{n.body}</div>}
            </div>
          ))}
        </section>
      </div>

      {modalTask && (
        <TaskModal
          task={modalTask}
          lists={lists}
          labels={labels}
          onClose={() => setModalTask(null)}
          onSave={handleSaveTask}
          onDeleted={() => { setModalTask(null); reload(); }}
        />
      )}
    </AppShell>
  );
}

function TaskRow({ task, onOpen, showDate }: { task: Task; onOpen: () => void; showDate?: boolean }) {
  return (
    <div onClick={onOpen} style={{ padding: '8px 0', borderBottom: '1px solid var(--fk-border-faint)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 13.5 }}>{task.title}</span>
      {showDate && <span style={{ fontSize: 12, color: 'var(--fk-text-faint)' }}>{formatDate(task.due_date)}</span>}
    </div>
  );
}
