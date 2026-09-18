import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Label, Task } from '../types/operations';
import { formatDate } from '../lib/format';
import type { TrelloMember } from '../types/operations';

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  منخفضة: 'var(--fk-text-faint)',
  متوسطة: 'var(--fk-purple-dark)',
  عالية: '#B87A2E',
  عاجلة: '#B23A3A',
};

interface Props {
  task: Task;
  labelIds: string[];
  labels: Label[];
  members: TrelloMember[];
  onOpen: () => void;
}

export function TaskCard({ task, labelIds, labels, members, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const taskLabels = labels.filter((l) => labelIds.includes(l.id));
  const assignees = (task.trello_member_ids ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is TrelloMember => !!m);

  const overdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className="fk-card"
      style={{
        padding: 14,
        marginBottom: 10,
        cursor: 'grab',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
        {task.sync_status === 'error' && <span style={{ fontSize: 11, color: '#B23A3A' }} title={task.sync_error ?? ''}>⚠ مزامنة</span>}
      </div>
      <div style={{ fontSize: 14.5, marginBottom: 8, lineHeight: 1.5 }}>{task.title}</div>

      {taskLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {taskLabels.map((l) => (
            <span
              key={l.id}
              style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: `${l.color}22`, color: l.color, border: `1px solid ${l.color}55` }}
            >
              {l.name_ar}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.due_date ? (
          <span style={{ fontSize: 11.5, color: overdue ? '#B23A3A' : 'var(--fk-text-faint)' }}>{formatDate(task.due_date)}</span>
        ) : (
          <span />
        )}
        {assignees.length > 0 && (
          <div style={{ display: 'flex', gap: -6 }}>
            {assignees.slice(0, 3).map((m) => (
              <div
                key={m.id}
                title={m.fullName}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(178,166,192,.25)',
                  border: '1px solid var(--fk-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  marginInlineStart: -6,
                }}
              >
                {m.initials || m.fullName.charAt(0)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
