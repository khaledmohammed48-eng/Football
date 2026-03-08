'use client';

import { useState } from 'react';
import { PhotoUploader } from '@/components/profile/photo-uploader';

interface CoachProfileClientProps {
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  mobile?: string | null;
  team?: { id: string; name: string } | null;
}

export function CoachProfileClient({ name, photoUrl, phone, mobile, team }: CoachProfileClientProps) {
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw]       = useState('');
  const [newPw, setNewPw]               = useState('');
  const [pwMsg, setPwMsg]               = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving]             = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setPwMsg(null);
    const res = await fetch('/api/player/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setPwMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح ✅' });
      setCurrentPw('');
      setNewPw('');
      setTimeout(() => { setShowChangePw(false); setPwMsg(null); }, 2000);
    } else {
      setPwMsg({ type: 'error', text: data.error ?? 'حدث خطأ' });
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ملفي الشخصي</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Photo */}
        <div className="flex flex-col items-center mb-6">
          <PhotoUploader currentPhotoUrl={photoUrl} name={name} size="lg" />
          <h2 className="text-xl font-bold text-gray-900 mt-4">{name}</h2>
          <span className="mt-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">مدرب</span>
        </div>

        {/* Info */}
        <div className="space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
          {team && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">🏆 {team.name}</span>
              <span className="text-gray-400">الفريق</span>
            </div>
          )}
          {(mobile ?? phone) && (
            <div className="flex justify-between items-center">
              <span dir="ltr" className="font-medium text-gray-800">{mobile ?? phone}</span>
              <span className="text-gray-400">رقم الجوال (تسجيل الدخول)</span>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <button
          onClick={() => { setShowChangePw((v) => !v); setPwMsg(null); }}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition"
        >
          <span className="text-gray-400 text-xs">{showChangePw ? '▲ إخفاء' : '▼ عرض'}</span>
          <span>🔑 تغيير كلمة المرور</span>
        </button>

        {showChangePw && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 text-right">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={6}
                placeholder="٦ أحرف على الأقل"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            {pwMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              {saving ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        لتغيير بيانات الملف الشخصي، تواصل مع مدير الأكاديمية
      </p>
    </div>
  );
}
