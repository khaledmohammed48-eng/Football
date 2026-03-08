'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { POSITION_LABELS } from '@football-academy/shared';

interface Player {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  position?: string;
  dateOfBirth?: string;
  isActive: boolean;
  subscriptionEnd?: string | null;
  team?: { id: string; name: string };
}

interface Team { id: string; name: string; }

type ImportRowResult = {
  row: number; name: string; phone: string;
  status: 'ok' | 'error'; error?: string; playerId?: string; ageGroup?: string;
};

function daysLeft(sub?: string | null) {
  if (!sub) return null;
  return Math.ceil((new Date(sub).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function isSubscriptionExpired(sub?: string | null) {
  if (!sub) return false;
  return new Date(sub) < new Date();
}

/* ─── Excel Import Panel ─────────────────────────────────────────── */
function ExcelImportPanel({ teams, onDone }: { teams: Team[]; onDone: () => void }) {
  const [open, setOpen]               = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [teamId, setTeamId]           = useState('');
  const [password, setPassword]       = useState('123456');
  const [autoAgeGroups, setAutoAgeGroups] = useState(false);
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState<{ imported: number; skipped: number; total: number; rows: ImportRowResult[]; ageGroupSummary?: Record<string, number> } | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const ok = f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv');
    if (!ok) { alert('يرجى اختيار ملف Excel أو CSV فقط (.xlsx / .xls / .csv)'); return; }
    setFile(f);
    setResult(null);
  }

  async function doImport() {
    if (!file) return;
    if (password.length < 8) { alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('defaultPassword', password);
    if (autoAgeGroups) fd.append('autoAgeGroups', 'true');
    else if (teamId) fd.append('teamId', teamId);
    try {
      const r = await fetch('/api/admin/players/import', { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? 'حدث خطأ'); return; }
      setResult(data);
      if (data.imported > 0) onDone();
    } finally {
      setImporting(false);
    }
  }

  function reset() { setFile(null); setResult(null); setAutoAgeGroups(false); }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        📥 استيراد من Excel
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-6 overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-5 py-4 flex items-center justify-between">
          <button onClick={() => { setOpen(false); reset(); }} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          <h2 className="text-white font-semibold">📥 استيراد لاعبين من Excel</h2>
        </div>

        <div className="p-5">
          {/* Template hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800 text-right space-y-1">
            <p className="font-semibold text-sm">أعمدة الملف المتوقعة (الترتيب غير مهم):</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              <p><span className="font-medium text-blue-900">الاسم</span> — مطلوب</p>
              <p><span className="font-medium text-blue-900">الجوال</span> — مطلوب</p>
              <p><span className="font-medium text-blue-900">العمر</span> — مطلوب للتوزيع التلقائي</p>
              <p><span className="font-medium text-blue-900">المركز</span> — حارس/مدافع/وسط/مهاجم</p>
              <p className="col-span-2"><span className="font-medium text-blue-900">الفريق</span> — اسم الفريق (يتجاوز الفريق الافتراضي)</p>
            </div>
            <p className="text-blue-600 mt-1">✓ يُسمح بتكرار نفس رقم الجوال (الأشقاء يستخدمون جوال والدهم)</p>
            <p className="text-blue-600">✓ يسجّل اللاعب بـ رقم الجوال + كلمة المرور الافتراضية</p>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${dragOver ? 'border-green-500 bg-green-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {file ? (
                <>
                  <div className="text-3xl mb-2">📊</div>
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — اضغط لتغيير الملف</p>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">📂</div>
                  <p className="text-sm text-gray-600">اسحب ملف Excel هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx · .xls · .csv — حتى 1000 لاعب</p>
                </>
              )}
            </div>
          )}

          {/* Settings */}
          {!result && (
            <div className="space-y-3 mb-5">
              {/* Auto age-group toggle */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer"
                onClick={() => setAutoAgeGroups((v) => !v)}>
                <input type="checkbox" checked={autoAgeGroups} onChange={(e) => setAutoAgeGroups(e.target.checked)}
                  className="w-4 h-4 accent-green-600 flex-shrink-0" onClick={(e) => e.stopPropagation()} />
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-900">توزيع تلقائي حسب الفئة العمرية</p>
                  <p className="text-xs text-emerald-700 mt-0.5">يضع اللاعبين في فرق U8/U10/U12/U14/U16/U18 حسب عمرهم — تُنشأ الفرق تلقائياً</p>
                </div>
              </div>

              {/* Age-group mapping (shown when toggle is on) */}
              {autoAgeGroups && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800">
                  <p className="font-semibold mb-2">التوزيع التلقائي:</p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                    <span>٦–٨ سنة → <b>U8</b></span>
                    <span>٩–١٠ سنة → <b>U10</b></span>
                    <span>١١–١٢ سنة → <b>U12</b></span>
                    <span>١٣–١٤ سنة → <b>U14</b></span>
                    <span>١٥–١٦ سنة → <b>U16</b></span>
                    <span>١٧–١٨ سنة → <b>U18</b></span>
                  </div>
                </div>
              )}

              {/* Team dropdown (only when auto age-group is off) */}
              {!autoAgeGroups && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 text-right">الفريق الافتراضي (اختياري)</label>
                  <select value={teamId} onChange={(e) => setTeamId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">بدون فريق</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 text-right">كلمة المرور الافتراضية</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456" dir="ltr" />
                <p className="text-xs text-gray-400 mt-0.5 text-right">يسجّل اللاعب بـ رقم الجوال + هذه الكلمة — يمكنه تغييرها لاحقاً</p>
              </div>
            </div>
          )}

          {/* Import button */}
          {!result && (
            <div className="flex justify-end gap-2">
              <button onClick={() => { setOpen(false); reset(); }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition">إلغاء</button>
              <button onClick={doImport} disabled={!file || importing}
                className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                {importing ? '⏳ جارٍ الاستيراد...' : '📥 ابدأ الاستيراد'}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold text-sm">✅ {result.imported} لاعب تم استيراده</span>
                {result.skipped > 0 && <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-semibold text-sm">❌ {result.skipped} سجل تخطّي</span>}
                <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm">الإجمالي: {result.total}</span>
              </div>

              {/* Age-group summary */}
              {result.ageGroupSummary && Object.keys(result.ageGroupSummary).length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-800 mb-2">توزيع حسب الفئة العمرية:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['U8', 'U10', 'U12', 'U14', 'U16', 'U18'] as const).filter((g) => result.ageGroupSummary![g]).map((g) => (
                      <span key={g} className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-xs font-medium">
                        {g}: {result.ageGroupSummary![g]} لاعب
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium w-12">سطر</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الاسم</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الجوال</th>
                        {result.ageGroupSummary && Object.keys(result.ageGroupSummary).length > 0 && (
                          <th className="text-right px-3 py-2 text-gray-500 font-medium">الفئة</th>
                        )}
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.rows.map((r) => (
                        <tr key={r.row} className={r.status === 'error' ? 'bg-red-50' : 'bg-white'}>
                          <td className="px-3 py-1.5 text-gray-400">{r.row}</td>
                          <td className="px-3 py-1.5 text-gray-800 font-medium">{r.name || '—'}</td>
                          <td className="px-3 py-1.5 text-gray-600" dir="ltr">{r.phone || '—'}</td>
                          {result.ageGroupSummary && Object.keys(result.ageGroupSummary).length > 0 && (
                            <td className="px-3 py-1.5">
                              {r.ageGroup ? <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{r.ageGroup}</span> : <span className="text-gray-300">—</span>}
                            </td>
                          )}
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
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">إغلاق</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function PlayersPage() {
  const [players, setPlayers]           = useState<Player[]>([]);
  const [teams, setTeams]               = useState<Team[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [teamFilter, setTeamFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (teamFilter) params.set('teamId', teamFilter);
    const res = await fetch(`/api/players?${params}`);
    const data = await res.json();
    setPlayers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, teamFilter]);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then(setTeams);
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  async function handleToggleActive(player: Player) {
    setTogglingId(player.id);
    const res = await fetch(`/api/players/${player.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !player.isActive }),
    });
    if (res.ok) setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, isActive: !p.isActive } : p));
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا اللاعب؟ سيتم حذف حسابه أيضاً.')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    fetchPlayers();
  }

  function getAge(dob?: string) {
    if (!dob) return '—';
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} سنة`;
  }

  const filtered = players.filter((p) => {
    if (statusFilter === 'active') return p.isActive;
    if (statusFilter === 'inactive') return !p.isActive;
    return true;
  });

  const activeCount   = players.filter((p) => p.isActive).length;
  const inactiveCount = players.filter((p) => !p.isActive).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">اللاعبون</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {players.length} لاعب — {activeCount} نشط · {inactiveCount} غير نشط
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelImportPanel teams={teams} onDone={fetchPlayers} />
          <Link
            href="/admin/accounts"
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ➕ إضافة لاعب
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-56" />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">جميع الفرق</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">جميع الحالات</option>
          <option value="active">نشط ({activeCount})</option>
          <option value="inactive">غير نشط ({inactiveCount})</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">⚽</div>
          <p className="font-medium">{search ? 'لا توجد نتائج للبحث' : 'لا يوجد لاعبون بعد'}</p>
          <p className="text-sm mt-1">استخدم زر "استيراد من Excel" لإضافة لاعبين بالجملة</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">اللاعب</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الجوال</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الحالة</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">المركز</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الفريق</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">العمر</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">الاشتراك</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((player) => {
                const subExpired = isSubscriptionExpired(player.subscriptionEnd);
                const dl         = daysLeft(player.subscriptionEnd);
                const isInactive = !player.isActive;
                return (
                  <tr key={player.id} className={`hover:bg-gray-50 transition ${isInactive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                          {player.photoUrl ? <img src={player.photoUrl} alt={player.name} className="w-8 h-8 object-cover" /> : '⚽'}
                        </div>
                        <span className={`text-sm font-medium ${isInactive ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{player.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500" dir="ltr">{player.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {isInactive
                        ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">غير نشط</span>
                        : subExpired
                          ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">منتهي الاشتراك</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">نشط</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {player.position ? POSITION_LABELS[player.position as keyof typeof POSITION_LABELS] : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{player.team?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getAge(player.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-sm">
                      {player.subscriptionEnd ? (
                        <span className={`text-xs ${subExpired ? 'text-red-600 font-medium' : dl !== null && dl <= 30 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {subExpired ? `انتهى منذ ${Math.abs(dl!)} يوم` : dl === 0 ? 'ينتهي اليوم' : `${dl} يوم`}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <Link href={`/admin/players/${player.id}`} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-md transition">عرض</Link>
                        <button onClick={() => handleToggleActive(player)} disabled={togglingId === player.id}
                          className={`text-xs px-2.5 py-1 rounded-md transition disabled:opacity-50 ${player.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {togglingId === player.id ? '...' : player.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                        <button onClick={() => handleDelete(player.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-md transition">حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
