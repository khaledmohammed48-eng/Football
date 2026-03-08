'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  description?: string;
  _count: { coaches: number; players: number };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    const res = await fetch('/api/teams');
    const data = await res.json();
    setTeams(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setName('');
    setDescription('');
    setSubmitting(false);
    fetchTeams();
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الفريق؟')) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    fetchTeams();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">الفرق</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">إنشاء فريق جديد</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفريق</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="مثال: الفئة العمرية تحت 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (اختياري)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="وصف الفريق..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الفريق'}
            </button>
          </form>
        </div>

        {/* Teams List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🏆</div>
              <div>لا توجد فرق بعد</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      {team.description && (
                        <p className="text-xs text-gray-500 mt-1">{team.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="text-red-400 hover:text-red-600 transition text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <span>👨‍💼 {team._count.coaches} مدرب</span>
                    <span>⚽ {team._count.players} لاعب</span>
                  </div>
                  <Link
                    href={`/admin/teams/${team.id}`}
                    className="block text-center text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition"
                  >
                    عرض التفاصيل
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
