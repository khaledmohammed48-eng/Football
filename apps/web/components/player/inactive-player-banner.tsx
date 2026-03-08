'use client';

import { useState, useEffect } from 'react';

interface Props {
  isActive: boolean;
  subscriptionEnd: string | null; // ISO string or null
  playerName: string;
  adminContact?: string | null;   // academy admin email if available
}

export function InactivePlayerBanner({ isActive, subscriptionEnd, playerName, adminContact }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Determine why the player is inactive
  const now = new Date();
  const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
  const isExpired = subEndDate !== null && subEndDate < now;
  const isDeactivated = !isActive;

  const shouldShow = (isDeactivated || isExpired) && !dismissed;

  // Session-storage: only show once per browser session (dismissal persists until logout)
  useEffect(() => {
    const key = 'inactive_banner_dismissed';
    if (sessionStorage.getItem(key) === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('inactive_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (!shouldShow) return null;

  const formattedExpiry = subEndDate
    ? subEndDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full text-right overflow-hidden">
        {/* Header stripe */}
        <div className={`px-6 py-5 ${isDeactivated && !isExpired ? 'bg-red-500' : 'bg-orange-500'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors text-2xl leading-none"
              aria-label="إغلاق"
            >
              ×
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {isDeactivated && !isExpired ? 'حسابك غير نشط' : 'انتهى اشتراكك'}
                </h2>
                <p className="text-white/80 text-sm mt-0.5">مرحباً، {playerName}</p>
              </div>
              <span className="text-3xl">{isDeactivated && !isExpired ? '🔒' : '⏰'}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {isExpired && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-orange-800 font-semibold text-sm">انتهى اشتراكك</p>
              <p className="text-orange-700 text-sm mt-1">
                انتهت صلاحية اشتراكك بتاريخ <strong>{formattedExpiry}</strong>.
              </p>
            </div>
          )}

          {isDeactivated && !isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-semibold text-sm">تم إيقاف تفعيل حسابك</p>
              <p className="text-red-700 text-sm mt-1">
                تم تعطيل حسابك من قبل الإدارة. يُرجى التواصل مع المدير لمعرفة السبب وإعادة التفعيل.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-gray-700 font-semibold text-sm">كيف تُجدد اشتراكك؟</p>
            <ul className="text-gray-600 text-sm space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>تواصل مع إدارة الأكاديمية لتجديد اشتراكك.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>بعد التجديد سيتم تفعيل حسابك وستعود قادراً على الوصول لجميع المميزات.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>بياناتك وسجل أدائك محفوظة ولن تُفقد.</span>
              </li>
            </ul>
          </div>

          {adminContact && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <span className="text-2xl">📧</span>
              <div className="text-right">
                <p className="text-blue-800 font-semibold text-sm">التواصل مع الإدارة</p>
                <p className="text-blue-600 text-sm break-all">{adminContact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            حسناً، سأتواصل مع الإدارة
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            يمكنك الاطلاع على ملفك الشخصي ومشاهدة البيانات، لكن بعض الميزات قد تكون محدودة.
          </p>
        </div>
      </div>
    </div>
  );
}
