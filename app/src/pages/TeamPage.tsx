import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { useTrelloMembers } from '../hooks/useTrelloMembers';
import { fetchProfiles, updateProfileRole, updateProfileTrelloLink } from '../services/operationsService';
import type { Profile, Role } from '../types';

/** Trello owns the team (members, avatars, names) - this page never creates
 * or edits a local roster. It only links an EXISTING Flowers KNOT website
 * account to its real Trello identity, so that account can see "my tasks".
 * Not every Trello member needs a website account (e.g. someone who only
 * ever uses trello.com), and this page cannot create one - accounts are
 * created through the normal registration flow. */
export function TeamPage() {
  const { members, loading: membersLoading } = useTrelloMembers();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      setProfiles(await fetchProfiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleRoleChange(profile: Profile, role: Role) {
    setSavingId(profile.id);
    try {
      await updateProfileRole(profile.id, role);
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الصلاحية');
    } finally {
      setSavingId(null);
    }
  }

  async function handleLinkChange(profile: Profile, trelloMemberId: string) {
    setSavingId(profile.id);
    try {
      const value = trelloMemberId || null;
      await updateProfileTrelloLink(profile.id, value);
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, trello_member_id: value } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الربط');
    } finally {
      setSavingId(null);
    }
  }

  const linkedMemberIds = new Set(profiles.map((p) => p.trello_member_id).filter(Boolean));
  const unlinkedTrelloMembers = members.filter((m) => !linkedMemberIds.has(m.id));

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>الفريق</div>
        <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>ربط حسابات الموقع بفريق Trello</h1>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--fk-text-muted)', margin: '16px 0 0', lineHeight: 1.9, maxWidth: 760 }}>
        فريق Trello (الأسماء والأعضاء) يُدار من Trello مباشرة. هنا فقط تُحدَّد صلاحية كل حساب مسجّل في الموقع (مدير / موظف)، ويمكن ربط
        الحساب بعضو حقيقي في Trello ليتمكن من رؤية مهامه الخاصة. ليس كل عضو Trello يحتاج حساباً على الموقع.
      </p>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}

      <div className="fk-card" style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
              <th style={thStyle}>الحساب</th>
              <th style={thStyle}>البريد الإلكتروني</th>
              <th style={thStyle}>الصلاحية</th>
              <th style={thStyle}>عضو Trello المرتبط</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
                <td style={tdStyle}>{p.full_name || '—'}</td>
                <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'right' }}>{p.email}</td>
                <td style={tdStyle}>
                  <select
                    className="fk-input"
                    style={{ width: 140, padding: '7px 10px', fontSize: 13 }}
                    value={p.role}
                    onChange={(e) => handleRoleChange(p, e.target.value as Role)}
                    disabled={savingId === p.id}
                  >
                    <option value="admin">مدير</option>
                    <option value="employee">موظف</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select
                    className="fk-input"
                    style={{ width: 200, padding: '7px 10px', fontSize: 13 }}
                    value={p.trello_member_id ?? ''}
                    onChange={(e) => handleLinkChange(p, e.target.value)}
                    disabled={savingId === p.id || membersLoading}
                  >
                    <option value="">بدون ربط</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <div style={{ padding: '30px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد حسابات مسجّلة.</div>}
      </div>

      <div className="fk-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 18, margin: '0 0 14px' }}>أعضاء Trello غير مرتبطين بحساب على الموقع</h3>
        {membersLoading ? (
          <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>...جارِ التحميل</div>
        ) : unlinkedTrelloMembers.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--fk-text-faint)' }}>كل أعضاء Trello مرتبطون بحساب، أو لا توجد بيانات Trello بعد.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unlinkedTrelloMembers.map((m) => (
              <span key={m.id} className="fk-btn-secondary" style={{ padding: '7px 14px', fontSize: 13, cursor: 'default' }}>
                {m.fullName}
              </span>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--fk-text-faint)', margin: '14px 0 0', lineHeight: 1.8 }}>
          هؤلاء يمكن تكليفهم بمهام من اللوحة وستظهر مهامهم في العرض الإداري، لكنهم يستخدمون Trello.com مباشرة ولا حساب لهم على موقع
          Flowers KNOT.
        </p>
      </div>
    </AppShell>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'start', padding: '14px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' };
const tdStyle: React.CSSProperties = { padding: '12px 18px', fontSize: 13.5 };
