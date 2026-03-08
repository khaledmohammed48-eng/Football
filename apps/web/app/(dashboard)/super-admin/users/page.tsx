'use client';

import { useState, useEffect } from 'react';

interface AdminUser { id: string; mobile: string | null; role: string; academyId: string | null; academyName: string | null; createdAt: string; }
interface Academy { id: string; name: string; city?: string | null; }

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', mobile: '', password: '', academyId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetModal, setResetModal] = useState<{ userId: string; mobile: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/super-admin/users'), fetch('/api/super-admin/academies')])
      .then(([ur, ar]) => Promise.all([ur.json(), ar.json()]))
      .then(([us, acs]) => { setUsers(Array.isArray(us) ? us : []); setAcademies(Array.isArray(acs) ? acs : []); setLoading(false); });
  }, []);

  async function handleResetPassword() {
    if (!resetModal) return;
    if (resetPassword.length < 8) { setResetMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }); return; }
    setResetting(true); setResetMsg(null);
    const res = await fetch(`/api/super-admin/users/${resetModal.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = await res.json();
    setResetting(false);
    if (!res.ok) { setResetMsg({ type: 'error', text: data.error ?? 'حدث خطأ' }); return; }
    setResetMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح ✅' });
    setTimeout(() => { setResetModal(null); setResetPassword(''); setResetMsg(null); }, 1500);
  }

  async function handleDelete(userId: string, mobile: string | null) {
    if (!confirm(`هل أنت متأكد من حذف المدير: ${mobile ?? userId}؟`)) return;
    const res = await fetch(`/api/super-admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? 'حدث خطأ'); return; }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setMessage(null);
    const res = await fetch('/api/super-admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setMessage({ type: 'error', text: data.error ?? 'حدث خطأ' }); setSubmitting(false); return; }
    setMessage({ type: 'success', text: 'تم إنشاء المدير بنجاح ✅' });
    setForm({ name: '', mobile: '', password: '', academyId: '' });
    fetch('/api/super-admin/users').then((r) => r.json()).then((us) => setUsers(Array.isArray(us) ? us : []));
    setSubmitting(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">مديرو الأكاديميات</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">إضافة مدير جديد</h2>
          <form onSubmit={handleCreate} className="space-y-3" autoComplete="off">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم المدير"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">رقم الجوال</label>
              <input type="tel" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                dir="ltr" placeholder="05xxxxxxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="text-xs text-gray-400 mt-1">سيستخدم المدير هذا الرقم لتسجيل الدخول</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 أحرف على الأقل"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الأكاديمية</label>
              <select required value={form.academyId} onChange={(e) => setForm({ ...form, academyId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— اختر الأكاديمية —</option>
                {academies.map((a) => <option key={a.id} value={a.id}>{a.name}{a.city ? ` (${a.city})` : ''}</option>)}
              </select>
            </div>
            {message && (
              <div className={`text-sm px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{message.text}</div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition">
              {submitting ? 'جارٍ الإنشاء...' : 'إنشاء المدير'}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">قائمة المديرين ({users.length})</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">جارٍ التحميل...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا يوجد مديرون بعد</div>
          ) : (
            <ul className="space-y-3">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                    📱
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate" dir="ltr">{u.mobile ?? '—'}</div>
                    <div className="text-xs text-gray-500">{u.academyName ?? 'بدون أكاديمية'}</div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('ar-SA')}</div>
                  <button
                    onClick={() => { setResetModal({ userId: u.id, mobile: u.mobile ?? '—' }); setResetPassword(''); setResetMsg(null); }}
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg transition"
                    title="إعادة تعيين كلمة المرور"
                  >🔑</button>
                  <button
                    onClick={() => handleDelete(u.id, u.mobile)}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg transition"
                    title="حذف المدير"
                  >🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setResetModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">إعادة تعيين كلمة المرور</h3>
            <p className="text-sm text-gray-500 mb-4 dir-ltr">{resetModal.mobile}</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={8}
                placeholder="8 أحرف على الأقل"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
              />
            </div>
            {resetMsg && (
              <div className={`text-sm px-3 py-2 rounded-lg mb-3 ${resetMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{resetMsg.text}</div>
            )}
            <div className="flex gap-2">
              <button onClick={handleResetPassword} disabled={resetting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition">
                {resetting ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
              </button>
              <button onClick={() => setResetModal(null)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
