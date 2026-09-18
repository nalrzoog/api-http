import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTrelloMembers } from '../hooks/useTrelloMembers';
import { useWorkshops } from '../hooks/useWorkshops';
import {
  addChecklistItem,
  addComment,
  archiveTaskInTrello,
  deleteChecklistItem,
  deleteTask,
  fetchChecklistItems,
  fetchComments,
  fetchTaskFinancials,
  fetchTaskLabelIds,
  pushTaskToTrello,
  setTaskLabels,
  toggleChecklistItem,
  upsertTaskFinancials,
} from '../services/operationsService';
import { TASK_PRIORITIES } from '../types/operations';
import type { Label, Task, TaskChecklistItem, TaskComment, TaskInput, TaskList } from '../types/operations';
import { formatDateTime, formatMoney } from '../lib/format';

interface Props {
  task: Task | 'new';
  lists: TaskList[];
  labels: Label[];
  defaultListId?: string;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<Task>;
  onDeleted: () => void;
}

const CATEGORY_SUGGESTIONS = ['المبيعات', 'ورش العمل', 'الزواجات', 'التسويق', 'الاستراتيجية', 'الأغراض والمستلزمات'];

export function TaskModal({ task, lists, labels, defaultListId, onClose, onSave, onDeleted }: Props) {
  const { user, profile } = useAuth();
  const { members, loading: membersLoading } = useTrelloMembers();
  const { workshops } = useWorkshops();
  const isAdmin = profile?.role === 'admin';
  const isNew = task === 'new';

  const [title, setTitle] = useState(isNew ? '' : task.title);
  const [description, setDescription] = useState(isNew ? '' : task.description ?? '');
  const [category, setCategory] = useState(isNew ? '' : task.category ?? '');
  const [priority, setPriority] = useState<Task['priority']>(isNew ? 'متوسطة' : task.priority);
  const [listId, setListId] = useState(isNew ? defaultListId ?? lists[0]?.id ?? '' : task.list_id);
  const [startDate, setStartDate] = useState(isNew ? '' : task.start_date ?? '');
  const [dueDate, setDueDate] = useState(isNew ? '' : task.due_date ?? '');
  const [customerName, setCustomerName] = useState(isNew ? '' : task.customer_name ?? '');
  const [customerPhone, setCustomerPhone] = useState(isNew ? '' : task.customer_phone ?? '');
  const [orderNumber, setOrderNumber] = useState(isNew ? '' : task.order_number ?? '');
  const [workshopId, setWorkshopId] = useState(isNew ? '' : task.workshop_id ?? '');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(isNew ? [] : task.trello_member_ids ?? []);

  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [revenue, setRevenue] = useState('0');
  const [cost, setCost] = useState('0');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    fetchTaskLabelIds(task.id).then(setSelectedLabelIds).catch(() => {});
    fetchChecklistItems(task.id).then(setChecklist).catch(() => {});
    fetchComments(task.id).then(setComments).catch(() => {});
    if (isAdmin) fetchTaskFinancials(task.id).then((f) => {
      if (f) { setRevenue(String(f.revenue)); setCost(String(f.cost)); }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, task === 'new' ? null : task.id, isAdmin]);

  async function handleSave() {
    if (saving) return;
    setError(null);
    if (!title.trim()) { setError('يرجى إدخال عنوان المهمة'); return; }
    if (!listId) { setError('يرجى اختيار القائمة'); return; }

    setSaving(true);
    try {
      const input: TaskInput = {
        list_id: listId,
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        priority,
        start_date: startDate || null,
        due_date: dueDate || null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        order_number: orderNumber.trim() || null,
        wedding_client_id: isNew ? null : task.wedding_client_id,
        workshop_id: workshopId || null,
        tags: isNew ? [] : task.tags,
        trello_member_ids: selectedMemberIds,
      };
      const saved = await onSave(input);
      await setTaskLabels(saved.id, selectedLabelIds);
      setSyncing(true);
      try {
        await pushTaskToTrello(saved.id);
        setSyncNote('تمت المزامنة مع Trello');
      } catch (syncErr) {
        setSyncNote(syncErr instanceof Error ? syncErr.message : 'تعذرت المزامنة مع Trello، سيتم إعادة المحاولة لاحقاً');
      } finally {
        setSyncing(false);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ البيانات، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew || saving) return;
    setSaving(true);
    try {
      try { await archiveTaskInTrello(task.id); } catch { /* archive best-effort, still delete locally */ }
      await deleteTask(task.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحذف، حاول مرة أخرى');
      setSaving(false);
    }
  }

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleAddChecklistItem() {
    if (isNew || !newChecklistTitle.trim()) return;
    const item = await addChecklistItem(task.id, newChecklistTitle.trim(), checklist.length);
    setChecklist((prev) => [...prev, item]);
    setNewChecklistTitle('');
  }

  async function handleToggleChecklist(item: TaskChecklistItem) {
    await toggleChecklistItem(item.id, !item.is_done);
    setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, is_done: !c.is_done } : c)));
  }

  async function handleDeleteChecklistItem(id: string) {
    await deleteChecklistItem(id);
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAddComment() {
    if (isNew || !newComment.trim() || !user) return;
    const c = await addComment(task.id, user.id, newComment.trim());
    setComments((prev) => [...prev, c]);
    setNewComment('');
  }

  async function handleSaveFinancials() {
    if (isNew) return;
    await upsertTaskFinancials(task.id, Number(revenue) || 0, Number(cost) || 0);
  }

  const canEditCore = isAdmin || isNew === false;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,55,51,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 40 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="fk-card" style={{ width: '100%', maxWidth: 640, padding: 'clamp(22px,3vw,34px)', maxHeight: '92vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 24, margin: '0 0 20px' }}>
          {isNew ? 'مهمة جديدة' : 'تفاصيل المهمة'}
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label className="fk-label">العنوان</label>
          <input className="fk-input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} placeholder="عنوان المهمة" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fk-label">الوصف</label>
          <textarea className="fk-input" style={{ minHeight: 70, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">القائمة (الحالة)</label>
            <select className="fk-input" value={listId} onChange={(e) => setListId(e.target.value)} disabled={saving}>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="fk-label">الأولوية</label>
            <select className="fk-input" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} disabled={saving}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="fk-label">التصنيف</label>
            <input className="fk-input" list="category-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving} />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">تاريخ البداية</label>
            <input type="date" className="fk-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">تاريخ الاستحقاق</label>
            <input type="date" className="fk-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fk-label">التصنيفات (Trello Labels)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {labels.map((l) => {
              const active = selectedLabelIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLabel(l.id)}
                  disabled={saving}
                  style={{
                    fontSize: 12,
                    padding: '5px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: `1px solid ${l.color}`,
                    background: active ? l.color : 'transparent',
                    color: active ? '#fff' : l.color,
                  }}
                >
                  {l.name_ar}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fk-label">المكلّفون (من فريق Trello)</label>
          {membersLoading ? (
            <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>...جارِ التحميل</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map((m) => {
                const active = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    disabled={saving}
                    className={active ? 'fk-btn-primary' : 'fk-btn-secondary'}
                    style={{ padding: '6px 12px', fontSize: 12.5 }}
                  >
                    {m.fullName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">اسم العميل</label>
            <input className="fk-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">جوال العميل</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">رقم الطلب</label>
            <input className="fk-input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">مرجع الورشة</label>
            <select className="fk-input" value={workshopId} onChange={(e) => setWorkshopId(e.target.value)} disabled={saving}>
              <option value="">بدون</option>
              {workshops.map((w) => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 14, padding: 14, border: '1px solid var(--fk-border)', borderRadius: 6 }}>
            <label className="fk-label">الماليات (للمدير فقط)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--fk-text-faint)' }}>الإيراد</span>
                <input type="number" className="fk-input" value={revenue} onChange={(e) => setRevenue(e.target.value)} onBlur={handleSaveFinancials} disabled={isNew} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--fk-text-faint)' }}>التكلفة</span>
                <input type="number" className="fk-input" value={cost} onChange={(e) => setCost(e.target.value)} onBlur={handleSaveFinancials} disabled={isNew} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--fk-text-faint)' }}>الربح (تلقائي)</span>
                <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 18, padding: '10px 0' }}>{formatMoney((Number(revenue) || 0) - (Number(cost) || 0))}</div>
              </div>
            </div>
            {isNew && <div style={{ fontSize: 11.5, color: 'var(--fk-text-faint)', marginTop: 6 }}>احفظ المهمة أولاً لإضافة القيم المالية.</div>}
          </div>
        )}

        {!isNew && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label className="fk-label">قائمة المهام الفرعية</label>
              {checklist.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <input type="checkbox" checked={item.is_done} onChange={() => handleToggleChecklist(item)} />
                  <span style={{ flex: 1, fontSize: 13.5, textDecoration: item.is_done ? 'line-through' : 'none', color: item.is_done ? 'var(--fk-text-faint)' : 'inherit' }}>{item.title}</span>
                  <button className="fk-btn-link" style={{ color: 'var(--fk-purple-dark)', fontSize: 12 }} onClick={() => handleDeleteChecklistItem(item.id)}>حذف</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input className="fk-input" value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)} placeholder="بند جديد" onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()} />
                <button className="fk-btn-secondary" onClick={handleAddChecklistItem}>إضافة</button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="fk-label">التعليقات</label>
              {comments.map((c) => (
                <div key={c.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--fk-border-faint)' }}>
                  <div>{c.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--fk-text-faint)' }}>{formatDateTime(c.created_at)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input className="fk-input" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="أضف تعليقاً" onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                <button className="fk-btn-secondary" onClick={handleAddComment}>إرسال</button>
              </div>
            </div>
          </>
        )}

        {error && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}
        {syncNote && <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--fk-text-faint)' }}>{syncing ? '...جارِ المزامنة مع Trello' : syncNote}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {canEditCore && (
            <button className="fk-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
              {saving && <span className="fk-spinner" />}
              حفظ
            </button>
          )}
          <button className="fk-btn-secondary" onClick={onClose} disabled={saving}>إغلاق</button>
          {!isNew && isAdmin && (
            <button className="fk-btn-secondary" style={{ color: 'var(--fk-purple-dark)' }} onClick={handleDelete} disabled={saving}>حذف</button>
          )}
        </div>
      </div>
    </div>
  );
}
