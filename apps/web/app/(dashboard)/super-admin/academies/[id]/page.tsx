'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const ALL_AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21'];

interface Academy {
  id: string; name: string; city?: string | null; location?: string | null; logoUrl?: string | null;
  ageGroups: string[];
  _count: { players: number; teams: number; coaches: number };
  users: { id: string; email: string; createdAt: string }[];
  teams: { id: string; name: string; _count: { players: number } }[];
}

export default function AcademyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', location: '', logoUrl: '', ageGroups: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/super-admin/academies/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setAcademy(d);
        setForm({ name: d.name, city: d.city ?? '', location: d.location ?? '', logoUrl: d.logoUrl ?? '', ageGroups: d.ageGroups });
        setLoading(false);
      });
  }, [id]);

  function toggleGroup(g: string) {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.includes(g) ? f.ageGroups.filter((x) => x !== g) : [...f.ageGroups, g],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.ageGroups.length === 0) { setSaveMsg({ type: 'error', text: 'يجب اختيار فئة عمرية واحدة على الأقل' }); return; }
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/super-admin/academies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, city: form.city || null, location: form.location || null, logoUrl: form.logoUrl || null, ageGroups: form.ageGroups }),
    });
    const data = await res.json();
    if (res.ok) {
      setAcademy(data);
      setSaveMsg({ type: 'success', text: 'تم حفظ التعديلات ✅' });
      setEditing(false);
    } else {
      setSaveMsg({ type: 'error', text: data.error ?? 'حدث خطأ' });
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;
  if (!academy) return <div className="text-center py-16 text-red-400">الأكاديمية غير موجودة</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/super-admin/academies" className="text-gray-400 hover:text-gray-600 transition">← الأكاديميات</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{academy.name}</h1>
      </div>

      {saveMsg && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2.5 ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {saveMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Academy info / edit */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="font-semibold text-gray-800 mb-2">تعديل بيانات الأكاديمية</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الأكاديمية *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                <input type="text" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئات العمرية *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AGE_GROUPS.map((g) => (
                    <button key={g} type="button" onClick={() => toggleGroup(g)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.ageGroups.includes(g) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                  {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setSaveMsg(null); }}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl overflow-hidden">
                    {academy.logoUrl ? <img src={academy.logoUrl} alt={academy.name} className="w-14 h-14 object-cover rounded-full" /> : '🏟️'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{academy.name}</h2>
                    {academy.city && <p className="text-sm text-gray-500">{academy.city}{academy.location ? ` — ${academy.location}` : ''}</p>}
                  </div>
                </div>
                <button onClick={() => setEditing(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                  ✏️ تعديل
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'اللاعبون', val: academy._count.players, icon: '⚽' },
                  { label: 'الفرق', val: academy._count.teams, icon: '🏆' },
                  { label: 'المدربون', val: academy._count.coaches, icon: '👨‍💼' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-xl font-bold text-gray-800">{s.val}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">الفئات العمرية</p>
                <div className="flex flex-wrap gap-1">
                  {academy.ageGroups.map((g) => (
                    <span key={g} className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">مديرو الأكاديمية</h3>
            <Link href="/super-admin/users" className="text-xs text-green-600 hover:underline">+ إضافة</Link>
          </div>
          {academy.users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا يوجد مديرون بعد</p>
          ) : (
            <ul className="space-y-2">
              {academy.users.map((u) => (
                <li key={u.id} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="font-medium">{u.email}</div>
                  <div className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('ar-SA')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Teams */}
      {academy.teams.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">الفرق ({academy.teams.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {academy.teams.map((t) => (
              <div key={t.id} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="font-medium text-sm text-gray-800">{t.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t._count.players} لاعب</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
