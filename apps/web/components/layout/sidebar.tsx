'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', label: 'لوحة التحكم', icon: '🏠' },
  { href: '/super-admin/academies', label: 'الأكاديميات', icon: '🏟️' },
  { href: '/super-admin/users', label: 'مديرو الأكاديميات', icon: '👥' },
];

const adminNav: NavItem[] = [
  { href: '/admin', label: 'لوحة التحكم', icon: '🏠' },
  { href: '/admin/teams', label: 'الفرق', icon: '🏆' },
  { href: '/admin/players', label: 'اللاعبون', icon: '⚽' },
  { href: '/admin/coaches', label: 'المدربون', icon: '👨‍💼' },
  { href: '/admin/accounts', label: 'الحسابات', icon: '👤' },
  { href: '/admin/leagues', label: 'الدوريات', icon: '🏅' },
  { href: '/admin/academy-profile', label: 'ملف الأكاديمية', icon: '🏟️' },
  { href: '/admin/academies', label: 'أكاديميات أخرى', icon: '🤝' },
  { href: '/admin/matches',     label: 'طلبات المباريات', icon: '⚔️' },
  { href: '/admin/leaderboard', label: 'ترتيب الأكاديميات', icon: '📊' },
  { href: '/admin/settings',    label: 'الإعدادات',       icon: '⚙️' },
];

const coachNav: NavItem[] = [
  { href: '/coach/team',        label: 'فريقي',              icon: '🏆' },
  { href: '/coach/matches',     label: 'المباريات',           icon: '⚔️' },
  { href: '/coach/leagues',     label: 'الدوريات',           icon: '🏅' },
  { href: '/coach/leaderboard', label: 'ترتيب الأكاديميات',  icon: '📊' },
  { href: '/coach/profile',     label: 'ملفي الشخصي',        icon: '👨‍💼' },
];

const playerNav: NavItem[] = [
  { href: '/player/profile',     label: 'ملفي الشخصي',       icon: '⚽' },
  { href: '/player/matches',     label: 'المباريات',          icon: '⚔️' },
  { href: '/player/leagues',     label: 'الدوريات',          icon: '🏅' },
  { href: '/player/leaderboard', label: 'ترتيب الأكاديميات', icon: '📊' },
];

interface SidebarProps {
  role: string;
  userEmail: string;
  displayName?: string;
  academyName?: string;
  academyLogoUrl?: string | null;
  photoUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, userEmail, displayName, academyName, academyLogoUrl, photoUrl, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === 'SUPER_ADMIN' ? superAdminNav :
    role === 'ADMIN'       ? adminNav       :
    role === 'COACH'       ? coachNav       : playerNav;

  const roleLabel =
    role === 'SUPER_ADMIN' ? 'مدير عام' :
    role === 'ADMIN'       ? 'مدير'     :
    role === 'COACH'       ? 'مدرب'     : 'لاعب';

  const sidebarTitle =
    role === 'SUPER_ADMIN'
      ? 'أكاديمتنا'
      : academyName ?? 'الأكاديمية';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed right-0 top-0 z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo + mobile close button */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-800">
              {academyLogoUrl ? (
                <img src={academyLogoUrl} alt="شعار الأكاديمية" className="w-12 h-12 object-cover" />
              ) : (
                <Image
                  src="/logo.svg"
                  alt="شعار الأكاديمية"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight truncate">{sidebarTitle}</div>
              <div className="text-xs text-gray-400 mt-0.5">{roleLabel}</div>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition flex-shrink-0"
              aria-label="إغلاق القائمة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin' || item.href === '/super-admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="mb-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center overflow-hidden flex-shrink-0 border border-green-600">
              {photoUrl ? (
                <img src={photoUrl} alt="صورة الملف" className="w-9 h-9 object-cover rounded-full" />
              ) : (
                <span className="text-sm text-white">
                  {(displayName ?? userEmail)?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">
                {displayName && !displayName.includes('@academy.local') ? displayName : userEmail}
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5">{roleLabel}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                // Get CSRF token first
                const csrfRes = await fetch('/api/auth/csrf');
                const { csrfToken } = await csrfRes.json();
                // POST to signout endpoint
                await fetch('/api/auth/signout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({ csrfToken }),
                });
              } catch {
                // ignore errors, proceed to redirect
              }
              window.location.href = '/login';
            }}
            className="w-full text-right text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-800 min-h-[44px]"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
