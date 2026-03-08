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
}

export function Sidebar({ role, userEmail, displayName, academyName, academyLogoUrl, photoUrl }: SidebarProps) {
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
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed right-0 top-0 z-40">
      {/* Logo */}
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
          <div>
            <div className="font-bold text-sm leading-tight">{sidebarTitle}</div>
            <div className="text-xs text-gray-400 mt-0.5">{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
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
          className="w-full text-right text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
