'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CoachEditFormProps {
  coach: {
    id: string;
    name: string;
    phone?: string | null;
    teamIds?: string[];
    photoUrl?: string | null;
  };
  teams: { id: string; name: string }[];
}

export function CoachEditForm({ coach, teams }: CoachEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: coach.name,
    phone: coach.phone ?? '',
    teamIds: coach.teamIds ?? [],
    photoUrl: coach.photoUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  function toggleTeam(id: string) {
    setForm((f) => ({
      ...f,
      teamIds: f.teamIds.includes(id)
        ? f.teamIds.filter((t) => t !== id)
        : [...f.teamIds, id],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/coaches/${coach.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || null,
        photoUrl: form.photoUrl || null,
        teamIds: form.teamIds,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, photoUrl: data.url });
    }
    setUploading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-5">تعديل بيانات المدرب</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Multi-team checkboxes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الفرق المُسندة
            {form.teamIds.length > 0 && (
              <span className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {form.teamIds.length} {form.teamIds.length === 1 ? 'فريق' : 'فرق'}
              </span>
            )}
          </label>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {teams.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-3 text-center">لا توجد فرق</p>
            ) : (
              teams.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.teamIds.includes(t.id)}
                    onChange={() => toggleTeam(t.id)}
                    className="w-4 h-4 accent-green-600 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{t.name}</span>
                </label>
              ))
            )}
          </div>
          {form.teamIds.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">لم يتم تعيين أي فريق</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الصورة</label>
          <label className="cursor-pointer inline-block bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition">
            {uploading ? 'جاري الرفع...' : '📷 رفع صورة'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </label>
          {form.photoUrl && (
            <img src={form.photoUrl} alt="preview" className="mt-2 w-12 h-12 rounded-full object-cover" />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg text-sm transition"
        >
          {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
}
