'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoUpload } from '@/components/ui/logo-upload';

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21'];

export default function NewAcademyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', city: '', location: '', logoUrl: '', ageGroups: [] as string[],
    adminMobile: '', adminPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGroup(g: string) {
    setForm((f) => ({
      ...f,
      ageGroups: f.ageGroups.includes(g) ? f.ageGroups.filter((x) => x !== g) : [...f.ageGroups, g],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.ageGroups.length === 0) { setError('يجب اختيار فئة عمرية واحدة على الأقل'); return; }
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      city: form.city || null,
      location: form.location || null,
      logoUrl: form.logoUrl || null,
      ageGroups: form.ageGroups,
    };
    if (form.adminMobile) {
      payload.adminMobile = form.adminMobile;
      payload.adminPassword = form.adminPassword;
    }

    const res = await fetch('/api/super-admin/academies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'حدث خطأ'); setSubmitting(false); return; }
    router.push('/super-admin/academies');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">إضافة أكاديمية جديدة</h1>
      <div className="max-w-lg bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ─── Academy Info ─── */}
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">معلومات الأكاديمية</h2>

            <div className="space-y-4">
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
              <LogoUpload
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئات العمرية *</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((g) => (
                    <button key={g} type="button" onClick={() => toggleGroup(g)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.ageGroups.includes(g) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Admin User ─── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">حساب مدير الأكاديمية</h2>
            <p className="text-xs text-gray-400 mb-4">اختياري — يمكن إضافته لاحقاً من صفحة المديرين</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم جوال المدير</label>
                <input
                  type="tel"
                  value={form.adminMobile}
                  onChange={(e) => setForm({ ...form, adminMobile: e.target.value })}
                  dir="ltr"
                  placeholder="05xxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">سيستخدم المدير هذا الرقم لتسجيل الدخول</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور{form.adminMobile ? ' *' : ''}
                </label>
                <input
                  type="password"
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  required={!!form.adminMobile}
                  minLength={form.adminMobile ? 6 : undefined}
                  placeholder="6 أحرف على الأقل"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              {submitting ? 'جارٍ الحفظ...' : 'إنشاء الأكاديمية'}
            </button>
            <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
