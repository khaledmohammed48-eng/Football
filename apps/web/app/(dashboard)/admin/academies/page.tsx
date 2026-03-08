'use client';

import { useState, useEffect, useRef } from 'react';

interface OtherAcademy {
  id: string; name: string; logoUrl?: string | null; city?: string | null;
  ageGroups: string[]; _count: { players: number; teams: number };
}

export default function OtherAcademiesPage() {
  const [academies, setAcademies] = useState<OtherAcademy[]>([]);
  const [myAgeGroups, setMyAgeGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OtherAcademy | null>(null);
  const [commonGroups, setCommonGroups] = useState<string[]>([]);
  const [form, setForm] = useState({ ageGroup: '', proposedDate: '', location: '', homeOrAway: 'HOME' as 'HOME' | 'AWAY', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/academies').then((r) => r.json()),
      fetch('/api/admin/my-academy').then((r) => r.json()),
    ]).then(([acs, myAc]) => {
      setAcademies(Array.isArray(acs) ? acs : []);
      setMyAgeGroups(Array.isArray(myAc?.ageGroups) ? myAc.ageGroups : []);
      setLoading(false);
    });
  }, []);

  function openModal(academy: OtherAcademy) {
    // Cancel any pending auto-close from a previous submission
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const common = myAgeGroups.filter((g) => academy.ageGroups.includes(g));
    setCommonGroups(common);
    setSelected(academy);
    setForm({ ageGroup: common.length === 1 ? common[0] : '', proposedDate: '', location: '', homeOrAway: 'HOME', notes: '' });
    setSubmitting(false);
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  function closeModal() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSelected(null);
    setSubmitting(false);
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.ageGroup) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAcademyId: selected.id,
          ageGroup: form.ageGroup,
          proposedDate: new Date(form.proposedDate).toISOString(),
          location: form.location || null,
          homeOrAway: form.homeOrAway,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'حدث خطأ'); return; }
      setSuccessMsg(`تم إرسال طلب المباراة إلى ${selected.name} بنجاح!`);
      closeTimer.current = setTimeout(() => closeModal(), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">أكاديميات أخرى</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>
      ) : academies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">🏟️</div>
          <p className="text-gray-400">لا توجد أكاديميات أخرى مسجلة حتى الآن</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academies.map((a) => {
            const common = myAgeGroups.filter((g) => a.ageGroups.includes(g));
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {a.logoUrl
                      ? <img src={a.logoUrl} alt={a.name} className="w-10 h-10 object-cover rounded-full" />
                      : <span className="text-lg">🏟️</span>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.name}</h3>
                    {a.city && <p className="text-xs text-gray-500">{a.city}</p>}
                  </div>
                </div>
                <div className="flex gap-3 text-sm text-gray-500 mb-2">
                  <span>⚽ {a._count.players} لاعب</span>
                  <span>🏆 {a._count.teams} فريق</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {a.ageGroups.map((g) => (
                    <span key={g} className={`text-xs px-2 py-0.5 rounded-full ${common.includes(g) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}>{g}</span>
                  ))}
                </div>
                {common.length === 0 ? (
                  <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-center">لا توجد فئات عمرية مشتركة</div>
                ) : (
                  <button onClick={() => openModal(a)} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition">
                    ⚔️ طلب مباراة
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Match request modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">طلب مباراة</h2>
            <p className="text-sm text-gray-500 mb-5">ضد: <span className="font-medium text-gray-800">{selected.name}</span></p>

            {successMsg ? (
              <div className="bg-green-50 text-green-700 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-medium">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={sendRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">الفئة العمرية المشتركة *</label>
                  <div className="flex flex-wrap gap-2">
                    {commonGroups.map((g) => (
                      <button key={g} type="button" onClick={() => setForm({ ...form, ageGroup: g })}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.ageGroup === g ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                  {!form.ageGroup && <p className="text-xs text-orange-500 mt-1">اختر فئة للمتابعة</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">التاريخ المقترح *</label>
                  <input type="datetime-local" required value={form.proposedDate}
                    onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الملعب / الموقع</label>
                  <input type="text" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">الدور</label>
                  <div className="flex gap-3">
                    {[{ val: 'HOME', label: '🏠 أرضنا' }, { val: 'AWAY', label: '✈️ أرضهم' }].map((opt) => (
                      <button key={opt.val} type="button" onClick={() => setForm({ ...form, homeOrAway: opt.val as 'HOME' | 'AWAY' })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.homeOrAway === opt.val ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات (اختياري)</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
                {errorMsg && <div className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">{errorMsg}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={submitting || !form.ageGroup}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition">
                    {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
                  </button>
                  <button type="button" onClick={closeModal}
                    className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
