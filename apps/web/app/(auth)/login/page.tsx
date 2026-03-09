'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  // Academy name loaded from public API
  const [academyName, setAcademyName] = useState('أكاديمتنا');

  useEffect(() => {
    fetch('/api/public/academy')
      .then((r) => r.json())
      .then((d) => { if (d.name) setAcademyName(d.name); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('رقم الجوال / البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" dir="rtl">

      {/* Left panel — branding / invite */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14 text-white">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt={academyName} width={64} height={64} className="object-contain drop-shadow-lg" />
          <div>
            <div className="text-2xl font-bold tracking-tight">{academyName}</div>
            <div className="text-green-300 text-sm mt-0.5">إدارة ذكية لأكاديميات كرة القدم</div>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-4xl font-extrabold leading-snug">
            أدِر أكاديميتك<br/>
            <span className="text-green-300">باحترافية كاملة</span>
          </h2>
          <ul className="space-y-4 text-green-100">
            {[
              { icon: '⚽', text: 'تتبع أداء اللاعبين وتطورهم' },
              { icon: '📊', text: 'جدولة التدريبات وإدارة الفرق' },
              { icon: '⚔️', text: 'تنظيم مباريات بين الأكاديميات' },
              { icon: '📈', text: 'لوحة إحصائيات وترتيب الأكاديميات' },
              { icon: '📥', text: 'استيراد اللاعبين دفعة واحدة من Excel' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm">
                <span className="text-xl w-8 text-center">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-green-400 text-xs space-y-1">
          <p>هل تريد الانضمام بأكاديميتك؟</p>
          <p className="flex items-center gap-2">
            <span>📞</span>
            <a href="tel:0550899901" dir="ltr" className="text-green-300 font-bold text-sm tracking-wide hover:text-white transition">
              0550899901
            </a>
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img src="/logo.svg" alt={academyName} width={80} height={80} className="object-contain drop-shadow-lg" />
            <h1 className="text-xl font-bold text-gray-900 mt-3">{academyName}</h1>
            <p className="text-gray-400 text-sm mt-0.5">إدارة كرة القدم</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900">مرحباً بك 👋</h2>
            <p className="text-gray-500 mt-1 text-sm">سجّل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                رقم الجوال أو البريد الإلكتروني
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="05xxxxxxxx أو example@academy.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                dir="ltr"
                autoComplete="username"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                جميع المستخدمين يسجلون الدخول برقم الجوال — المدير العام بالبريد الإلكتروني
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-xl transition text-sm shadow-lg shadow-green-200"
            >
              {loading ? '⏳ جاري تسجيل الدخول...' : 'تسجيل الدخول ←'}
            </button>
          </form>

          <div className="text-center mt-8 space-y-1">
            <p className="text-xs text-gray-400">هل تريد الانضمام بأكاديميتك؟</p>
            <a
              href="tel:0550899901"
              dir="ltr"
              className="inline-block text-sm font-bold text-green-600 hover:text-green-700 transition"
            >
              📞 0550899901
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
