'use client';

import { useState, useEffect, useCallback } from 'react';
import { ROLE_LABELS } from '@football-academy/shared';

interface Account {
  id: string;
  email: string;
  role: 'COACH' | 'PLAYER';
  createdAt: string;
  profile: { name: string; phone?: string | null; teamName?: string } | null;
}

interface Team {
  id: string;
  name: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset password modal state
  const [resetModal, setResetModal] = useState<{ id: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    role: 'PLAYER' as 'COACH' | 'PLAYER',
    name: '',
    teamId: '',
  });

  const fetchData = useCallback(async () => {
    const [accRes, teamRes] = await Promise.all([
      fetch('/api/accounts'),
      fetch('/api/teams'),
    ]);
    const [accs, tms] = await Promise.all([accRes.json(), teamRes.json()]);
    setAccounts(Array.isArray(accs) ? accs : []);
    setTeams(Array.isArray(tms) ? tms : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = { role: form.role, name: form.name, phone: form.phone, password: form.password, teamId: form.teamId || null };

    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setMessage({ type: 'success', text: 'تم إنشاء الحساب بنجاح' });
      setForm({ email: '', phone: '', password: '', role: 'PLAYER', name: '', teamId: '' });
      fetchData();
    } else {
      setMessage({ type: 'error', text: data.error || 'حدث خطأ' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  }

  async function handleResetPassword() {
    if (!resetModal) return;
    if (resetPassword.length < 6) {
      setResetMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    setResetting(true);
    setResetMsg(null);
    const res = await fetch(`/api/accounts/${resetModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = await res.json();
    setResetting(false);
    if (!res.ok) {
      setResetMsg({ type: 'error', text: data.error ?? 'حدث خطأ' });
      return;
    }
    setResetMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح ✅' });
    setTimeout(() => { setResetModal(null); setResetPassword(''); setResetMsg(null); }, 1500);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">إدارة الحسابات</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">إنشاء حساب جديد</h2>
          <form onSubmit={handleCreate} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'COACH' | 'PLAYER', email: '', phone: '' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="PLAYER">لاعب</option>
                <option value="COACH">مدرب</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="اسم اللاعب أو المدرب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="05xxxxxxxx"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.role === 'PLAYER'
                  ? 'سيستخدم اللاعب هذا الرقم لتسجيل الدخول'
                  : 'سيستخدم المدرب هذا الرقم لتسجيل الدخول'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="6 أحرف على الأقل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفريق (اختياري)</label>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">بدون فريق</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`text-sm rounded-lg px-4 py-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg text-sm transition"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">الحسابات الحالية</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد حسابات بعد</div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {acc.profile?.name ?? acc.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5" dir="ltr">
                      {acc.profile?.phone ?? '—'}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${acc.role === 'COACH' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {ROLE_LABELS[acc.role]}
                      </span>
                      {acc.profile?.teamName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          {acc.profile.teamName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setResetModal({ id: acc.id, name: acc.profile?.name ?? acc.email }); setResetPassword(''); setResetMsg(null); }}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg transition"
                      title="إعادة تعيين كلمة المرور"
                    >🔑</button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg transition"
                      title="حذف"
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setResetModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">إعادة تعيين كلمة المرور</h3>
            <p className="text-sm text-gray-500 mb-4">{resetModal.name}</p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={6}
                placeholder="6 أحرف على الأقل"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                dir="ltr"
              />
            </div>
            {resetMsg && (
              <div className={`text-sm px-3 py-2 rounded-lg mb-3 ${resetMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {resetMsg.text}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                {resetting ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
              </button>
              <button
                onClick={() => setResetModal(null)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition"
              >إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
