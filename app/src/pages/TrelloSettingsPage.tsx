import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import {
  fetchRecentSyncLogs,
  fetchTrelloConnectionStatus,
  pullBoardFromTrello,
  registerTrelloWebhook,
  saveTrelloCredentials,
  syncBoardStructure,
  testTrelloConnection,
} from '../services/operationsService';
import { formatDateTime } from '../lib/format';
import type { SyncLog, TrelloConnectionStatus } from '../types/operations';

export function TrelloSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [boardId, setBoardId] = useState('');
  const [status, setStatus] = useState<TrelloConnectionStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([fetchTrelloConnectionStatus(), fetchRecentSyncLogs(15)]);
      setStatus(s);
      setLogs(l);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function run(action: string, fn: () => Promise<unknown>, successMessage: string) {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(successMessage);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!apiKey.trim() || !token.trim()) { setError('يرجى إدخال API Key و Token'); return; }
    await run('save', () => saveTrelloCredentials({ api_key: apiKey.trim(), token: token.trim(), api_secret: apiSecret.trim(), board_id: boardId.trim() }), 'تم حفظ بيانات الاتصال');
    setApiKey('');
    setToken('');
    setApiSecret('');
  }

  async function handleTest() {
    setBusy('test');
    setError(null);
    setNotice(null);
    try {
      const res = await testTrelloConnection();
      setNotice(res.message);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر اختبار الاتصال');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return null;

  return (
    <AppShell>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>الإعدادات</div>
        <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>إعدادات Trello</h1>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      <div className="fk-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 20, margin: 0 }}>حالة الاتصال</h3>
          <span style={{ fontSize: 13, color: status?.is_connected ? 'var(--fk-green)' : '#B23A3A' }}>
            {status?.is_connected ? '● متصل' : '● غير متصل'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, fontSize: 13 }}>
          <div>
            <div style={{ color: 'var(--fk-text-faint)', marginBottom: 4 }}>معرف اللوحة</div>
            <div>{status?.board_id || '—'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--fk-text-faint)', marginBottom: 4 }}>آخر اختبار</div>
            <div>{formatDateTime(status?.last_tested_at ?? null)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--fk-text-faint)', marginBottom: 4 }}>نتيجة آخر اختبار</div>
            <div>{status?.last_test_result || '—'}</div>
          </div>
        </div>
      </div>

      <div className="fk-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 20, margin: '0 0 6px' }}>بيانات الاتصال</h3>
        <p style={{ fontSize: 12.5, color: 'var(--fk-text-faint)', margin: '0 0 18px', lineHeight: 1.8 }}>
          يتم حفظ هذه البيانات بشكل آمن على الخادم فقط ولا يتم عرضها مرة أخرى هنا لأي سبب أمني.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label className="fk-label">Trello API Key</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={busy === 'save'} />
          </div>
          <div>
            <label className="fk-label">Trello Token</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={token} onChange={(e) => setToken(e.target.value)} disabled={busy === 'save'} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">Trello API Secret (لتوثيق الـ webhook)</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} disabled={busy === 'save'} />
          </div>
          <div>
            <label className="fk-label">معرف لوحة Trello (Board ID)</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={boardId} onChange={(e) => setBoardId(e.target.value)} disabled={busy === 'save'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="fk-btn-primary" style={{ padding: '11px 20px' }} onClick={handleSave} disabled={!!busy}>
            {busy === 'save' ? '...جارِ الحفظ' : 'حفظ'}
          </button>
          <button className="fk-btn-secondary" onClick={handleTest} disabled={!!busy}>
            {busy === 'test' ? '...جارِ الاختبار' : 'اختبار الاتصال'}
          </button>
        </div>
      </div>

      <div className="fk-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 20, margin: '0 0 6px' }}>المزامنة</h3>
        <p style={{ fontSize: 12.5, color: 'var(--fk-text-faint)', margin: '0 0 18px', lineHeight: 1.8 }}>
          نفّذ مزامنة القوائم والتصنيفات أولاً بعد ربط اللوحة، ثم استورد البطاقات الحالية، ثم سجّل الـ webhook لتفعيل المزامنة الفورية من Trello.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="fk-btn-secondary" onClick={() => run('structure', syncBoardStructure, 'تمت مزامنة القوائم والتصنيفات')} disabled={!!busy}>
            {busy === 'structure' ? '...جارِ المزامنة' : '١. مزامنة القوائم والتصنيفات'}
          </button>
          <button className="fk-btn-secondary" onClick={() => run('pull', pullBoardFromTrello, 'تم استيراد البطاقات من Trello')} disabled={!!busy}>
            {busy === 'pull' ? '...جارِ الاستيراد' : '٢. استيراد البطاقات من Trello'}
          </button>
          <button className="fk-btn-secondary" onClick={() => run('webhook', registerTrelloWebhook, 'تم تسجيل الـ webhook - المزامنة الفورية مفعّلة الآن')} disabled={!!busy}>
            {busy === 'webhook' ? '...جارِ التسجيل' : '٣. تفعيل المزامنة الفورية (Webhook)'}
          </button>
        </div>
        {notice && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--fk-green)' }}>{notice}</div>}
        {error && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}
      </div>

      <div className="fk-card" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '18px 24px 0' }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 20, margin: 0 }}>سجل المزامنة</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14, minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
              <th style={{ textAlign: 'start', padding: '12px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' }}>الوقت</th>
              <th style={{ textAlign: 'start', padding: '12px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' }}>النوع</th>
              <th style={{ textAlign: 'start', padding: '12px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' }}>الاتجاه</th>
              <th style={{ textAlign: 'start', padding: '12px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' }}>الحالة</th>
              <th style={{ textAlign: 'start', padding: '12px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' }}>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
                <td style={{ padding: '12px 18px', fontSize: 13 }}>{formatDateTime(l.created_at)}</td>
                <td style={{ padding: '12px 18px', fontSize: 13 }}>{l.entity_type}</td>
                <td style={{ padding: '12px 18px', fontSize: 13 }}>{l.direction === 'to_trello' ? '→ Trello' : '← Trello'}</td>
                <td style={{ padding: '12px 18px', fontSize: 13, color: l.status === 'error' ? '#B23A3A' : 'var(--fk-green)' }}>{l.status === 'error' ? 'خطأ' : 'نجاح'}</td>
                <td style={{ padding: '12px 18px', fontSize: 13, color: 'var(--fk-text-faint)' }}>{l.message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div style={{ padding: '30px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fk-text-faint)' }}>لا توجد عمليات مزامنة بعد.</div>}
      </div>
    </AppShell>
  );
}
