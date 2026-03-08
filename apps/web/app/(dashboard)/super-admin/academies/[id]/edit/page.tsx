'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoUpload } from '@/components/ui/logo-upload';

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21'];

export default function EditAcademyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', city: '', location: '', logoUrl: '', ageGroups: [] as string[],
  });

  useEffect(() => {
    fetch(`/api/super-admin/academies/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          name: d.name ?? '',
          city: d.city ?? '',
          location: d.location ?? '',
          logoUrl: d.logoUrl ?? '',
          ageGroups: d.ageGroups ?? [],
        });
        setLoading(false);
      });
  }, [id]);

  function toggleGroup(g: string) {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.includes(g)
        ? f.ageGroups.filter((x) => x !== g)
        : [...f.ageGroups, g],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.ageGroups.length === 0) {
      setError('يجب اختيار فئة عمرية واحدة على الأقل');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/super-admin/academies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        city: form.city || null,
        location: form.location || null,
        logoUrl: form.logoUrl || null,
        ageGroups: form.ageGroups,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/super-admin/academies/${id}`);
    } else {
      setError(data.error ?? 'حدث خطأ');
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/super-admin/academies" className="text-gray-400 hover:text-gray-600 transition">← الأكاديميات</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/super-admin/academies/${id}`} className="text-gray-400 hover:text-gray-600 transition">{form.name}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">تعديل</h1>
      </div>

      <div className="max-w-lg bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Logo upload */}
          <LogoUpload
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
          />

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الأكاديمية *</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                <input
                  type="text" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                <input
                  type="text" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفئات العمرية *</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g} type="button" onClick={() => toggleGroup(g)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      form.ageGroups.includes(g)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              {submitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button
              type="button" onClick={() => router.back()}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
