'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team { id: string; name: string; logoUrl: string | null }
interface AcademyItem { id: string; name: string; city: string | null; logoUrl: string | null }

export default function NewLeaguePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [ageGroup, setAgeGroup] = useState('');
  const [rounds, setRounds] = useState(1);
  const [season, setSeason] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [academies, setAcademies] = useState<AcademyItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedAcademies, setSelectedAcademies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (type === 'INTERNAL') {
      fetch('/api/teams').then(r => r.json()).then(d => setTeams(Array.isArray(d) ? d : []));
    } else {
      fetch('/api/academies').then(r => r.json()).then(d => setAcademies(Array.isArray(d) ? d : []));
    }
  }, [type]);

  const toggleTeam = (id: string) =>
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAcademy = (id: string) =>
    setSelectedAcademies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const participants = type === 'INTERNAL' ? selectedTeams : selectedAcademies;
    if (participants.length < 2) { setError('يجب اختيار فريقين على الأقل'); return; }
    if (!name.trim()) { setError('اسم الدوري مطلوب'); return; }

    setLoading(true);
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        type,
        ageGroup: ageGroup || null,
        rounds,
        season: season || null,
        teamIds: type === 'INTERNAL' ? selectedTeams : undefined,
        academyIds: type === 'EXTERNAL' ? selectedAcademies : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'حدث خطأ'); return; }
    const league = await res.json();
    router.push(`/admin/leagues/${league.id}`);
  };

  const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21'];

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إنشاء دوري جديد</h1>
        <p className="text-gray-500 text-sm mt-1">حدد نوع الدوري والفرق المشاركة</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم الدوري</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: دوري الربيع 2026"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الدوري</label>
          <div className="grid grid-cols-2 gap-3">
            {(['INTERNAL', 'EXTERNAL'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setSelectedTeams([]); setSelectedAcademies([]); }}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${
                  type === t
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'INTERNAL' ? '🏠 داخلي (فرق الأكاديمية)' : '🌍 خارجي (أكاديميات أخرى)'}
              </button>
            ))}
          </div>
        </div>

        {/* Age group */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الفئة العمرية (اختياري)</label>
          <div className="flex gap-2 flex-wrap">
            {AGE_GROUPS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setAgeGroup(ageGroup === g ? '' : g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  ageGroup === g
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Rounds + Season row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">عدد الجولات</label>
            <select
              value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value={1}>جولة واحدة (ذهاب)</option>
              <option value={2}>جولتان (ذهاب وإياب)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الموسم (اختياري)</label>
            <input
              value={season}
              onChange={e => setSeason(e.target.value)}
              placeholder="مثال: 2025-2026"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        {/* Participant selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {type === 'INTERNAL' ? `اختر الفرق (${selectedTeams.length} محددة)` : `اختر الأكاديميات (${selectedAcademies.length} محددة — ستُضاف أكاديميتك تلقائياً)`}
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2">
            {type === 'INTERNAL' ? (
              teams.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">لا توجد فرق في أكاديميتك</p>
              ) : teams.map(t => (
                <label key={t.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${selectedTeams.includes(t.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selectedTeams.includes(t.id)} onChange={() => toggleTeam(t.id)} className="accent-green-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                </label>
              ))
            ) : (
              academies.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">لا توجد أكاديميات أخرى</p>
              ) : academies.map(a => (
                <label key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${selectedAcademies.includes(a.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selectedAcademies.includes(a.id)} onChange={() => toggleAcademy(a.id)} className="accent-green-600 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-800">{a.name}</span>
                  {a.city && <span className="text-xs text-gray-400">{a.city}</span>}
                </label>
              ))
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الدوري'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
