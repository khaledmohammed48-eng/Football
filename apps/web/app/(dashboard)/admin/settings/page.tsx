'use client';

import { useState, useEffect } from 'react';
import { PhotoUploader } from '@/components/profile/photo-uploader';

export default function AdminSettingsPage() {
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [mobileForm, setMobileForm] = useState('');
  const [mobileMsg, setMobileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingMobile, setSavingMobile] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setMobile(d.mobile ?? '');
        setMobileForm(d.mobile ?? '');
        setEmail(d.email ?? '');
        setLoadingProfile(false);
      });
    fetch('/api/profile/photo')
      .then((r) => r.json())
      .then((d) => setPhotoUrl(d.photoUrl ?? null))
      .catch(() => {});
  }, []);

  async function handleMobileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingMobile(true);
    setMobileMsg(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: mobileForm }),
    });
    const data = await res.json();
    if (res.ok) {
      setMobile(mobileForm);
      setMobileMsg({ type: 'success', text: 'تم تحديث رقم الجوال بنجاح ✅' });
    } else {
      setMobileMsg({ type: 'error', text: data.error ?? 'حدث خطأ' });
    }
    setSavingMobile(false);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين' });
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
      return;
    }
    setSavingPw(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح ✅' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } else {
      setPwMsg({ type: 'error', text: data.error ?? 'حدث خطأ' });
    }
    setSavingPw(false);
  }

  if (loadingProfile) return <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">الإعدادات الشخصية</h1>

      {/* Profile photo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex flex-col items-center">
        <h2 className="text-base font-semibold text-gray-700 mb-4 w-full text-right">الصورة الشخصية</h2>
        <PhotoUploader
          currentPhotoUrl={photoUrl}
          name={email}
          size="lg"
          onPhotoUpdated={(url) => setPhotoUrl(url)}
        />
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">معلومات الحساب</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">البريد الإلكتروني</span>
            <span className="font-medium text-gray-800">{email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">رقم الجوال الحالي</span>
            <span className="font-medium text-gray-800">{mobile || '—'}</span>
          </div>
        </div>
      </div>

      {/* Mobile update */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">تغيير رقم الجوال</h2>
        <form onSubmit={handleMobileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">رقم الجوال الجديد</label>
            <input
              type="tel"
              required
              placeholder="05XXXXXXXX"
              value={mobileForm}
              onChange={(e) => setMobileForm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-left"
              dir="ltr"
            />
          </div>
          {mobileMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 ${mobileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {mobileMsg.text}
            </div>
          )}
          <button
            type="submit"
            disabled={savingMobile || mobileForm === mobile}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            {savingMobile ? 'جارٍ الحفظ...' : 'حفظ رقم الجوال'}
          </button>
        </form>
      </div>

      {/* Password update */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">تغيير كلمة المرور</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              required
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              minLength={8}
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {pwMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.text}
            </div>
          )}
          <button
            type="submit"
            disabled={savingPw}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            {savingPw ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}
