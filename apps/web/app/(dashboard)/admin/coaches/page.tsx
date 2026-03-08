'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Coach {
  id: string;
  name: string;
  phone?: string | null;
  photoUrl?: string | null;
  team?: { id: string; name: string } | null;
  user: { mobile?: string | null };
  _count?: { notes: number };
}

interface Team { id: string; name: string; }

type CoachImportRowResult = {
  row: number; name: string; phone: string;
  status: 'ok' | 'error'; error?: string; coachId?: string;
};

/* ─── Coach Import Panel ────────────────────────────────────────── */
function CoachImportPanel({ teams, onDone }: { teams: Team[]; onDone: () => void }) {
  const [open, setOpen]           = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [teamId, setTeamId]       = useState('');
  const [password, setPassword]   = useState('12345678');
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<{ imported: number; skipped: number; total: number; rows: CoachImportRowResult[] } | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const ok = f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv');
    if (!ok) { alert('يرجى اختيار ملف Excel أو CSV فقط (.xlsx / .xls / .csv)'); return; }
    setFile(f);
    setResult(null);
  }

  async function doImport() {
    if (!file) return;
    if (password.length < 6) { alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('defaultPassword', password);
    if (teamId) fd.append('teamId', teamId);
    try {
      const r = await fetch('/api/coaches/import', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? 'حدث خطأ'); return; }
      setResult(data);
      if (data.imported > 0) onDone();
    } finally {
      setImporting(false);
    }
  }

  function reset() { setFile(null); setResult(null); }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        📥 استيراد مدربين من Excel
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-6 overflow-hidden">
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <button onClick={() => { setOpen(false); reset(); }} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          <h2 className="text-white font-semibold">📥 استيراد مدربين من Excel</h2>
        </div>

        <div className="p-5">
          {/* Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800 text-right space-y-1">
            <p className="font-semibold text-sm">أعمدة الملف المتوقعة:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              <p><span className="font-medium text-blue-900">الاسم</span> — مطلوب</p>
              <p><span className="font-medium text-blue-900">الجوال</span> — مطلوب</p>
              <p className="col-span-2"><span className="font-medium text-blue-900">الفريق</span> — اسم الفريق (اختياري)</p>
            </div>
            <p className="text-blue-600 mt-1">✓ يسجّل المدرب بـ رقم الجوال + كلمة المرور الافتراضية</p>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${dragOver ? 'border-blue-500 bg-blue-50' : file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {file ? (
                <>
                  <div className="text-3xl mb-2">📊</div>
                  <p className="font-medium text-blue-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — اضغط لتغيير الملف</p>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">📂</div>
                  <p className="text-sm text-gray-600">اسحب ملف Excel هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx · .xls · .csv — حتى 200 مدرب</p>
                </>
              )}
            </div>
          )}

          {/* Settings */}
          {!result && (
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 text-right">الفريق الافتراضي (اختياري)</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">بدون فريق</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 text-right">كلمة المرور الافتراضية</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678" dir="ltr" />
                <p className="text-xs text-gray-400 mt-0.5 text-right">يسجّل المدرب بـ رقم الجوال + هذه الكلمة — يمكنه تغييرها لاحقاً</p>
              </div>
            </div>
          )}

          {/* Import button */}
          {!result && (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setOpen(false); reset(); }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition">إلغاء</button>
              <button onClick={doImport} disabled={!file || importing}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                {importing ? '⏳ جارٍ الاستيراد...' : '📥 ابدأ الاستيراد'}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold text-sm">✅ {result.imported} مدرب تم استيراده</span>
                {result.skipped > 0 && <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-semibold text-sm">❌ {result.skipped} سجل تخطّي</span>}
                <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm">الإجمالي: {result.total}</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium w-12">سطر</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الاسم</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الجوال</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.rows.map((r) => (
                        <tr key={r.row} className={r.status === 'error' ? 'bg-red-50' : 'bg-white'}>
                          <td className="px-3 py-1.5 text-gray-400">{r.row}</td>
                          <td className="px-3 py-1.5 text-gray-800 font-medium">{r.name || '—'}</td>
                          <td className="px-3 py-1.5 text-gray-600" dir="ltr">{r.phone || '—'}</td>
                          <td className="px-3 py-1.5">
                            {r.status === 'ok'
                              ? <span className="text-green-600 font-medium">✅ تمّ</span>
                              : <span className="text-red-600">{r.error}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={reset} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition">استيراد ملف آخر</button>
                <button onClick={() => { setOpen(false); reset(); }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">إغلاق</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teams, setTeams]     = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoaches = useCallback(async () => {
    const [cr, tr] = await Promise.all([fetch('/api/coaches'), fetch('/api/teams')]);
    const [cs, ts] = await Promise.all([cr.json(), tr.json()]);
    setCoaches(Array.isArray(cs) ? cs : []);
    setTeams(Array.isArray(ts) ? ts : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">المدربون ({coaches.length})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <CoachImportPanel teams={teams} onDone={fetchCoaches} />
          <Link
            href="/admin/accounts"
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ➕ إضافة مدرب
          </Link>
        </div>
      </div>

      {coaches.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">👨‍💼</div>
          <div>لا يوجد مدربون</div>
          <p className="text-sm mt-1">استخدم زر &quot;استيراد مدربين من Excel&quot; لإضافة مدربين بالجملة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => (
            <Link
              key={coach.id}
              href={`/admin/coaches/${coach.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {coach.photoUrl ? (
                    <img src={coach.photoUrl} alt={coach.name} className="w-12 h-12 object-cover rounded-full" />
                  ) : '👨‍💼'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                  <p className="text-xs text-gray-500 truncate" dir="ltr">{coach.user.mobile ?? coach.phone ?? '—'}</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>🏆 {coach.team?.name ?? 'بدون فريق'}</span>
                {coach._count && <span>📝 {coach._count.notes} ملاحظة</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
