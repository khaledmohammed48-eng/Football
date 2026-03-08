'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CoachEditFormProps {
  coach: {
    id: string;
    name: string;
    phone?: string | null;
    teamId?: string | null;
    photoUrl?: string | null;
  };
  teams: { id: string; name: string }[];
}

export function CoachEditForm({ coach, teams }: CoachEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: coach.name,
    phone: coach.phone ?? '',
    teamId: coach.teamId ?? '',
    photoUrl: coach.photoUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/coaches/${coach.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, teamId: form.teamId || null }),
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
      const { url } = await res.json();
      setForm({ ...form, photoUrl: url });
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الفريق</label>
          <select
            value={form.teamId}
            onChange={(e) => setForm({ ...form, teamId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">بدون فريق</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
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
