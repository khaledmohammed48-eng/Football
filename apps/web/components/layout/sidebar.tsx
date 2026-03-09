'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const superAdminNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/super-admin', label: 'لوحة التحكم', icon: '🏠' },
      { href: '/super-admin/academies', label: 'الأكاديميات', icon: '🏟️' },
      { href: '/super-admin/users', label: 'مديرو الأكاديميات', icon: '👥' },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    label: 'الرئيسية',
    items: [{ href: '/admin', label: 'لوحة التحكم', icon: '🏠' }],
  },
  {
    label: 'إدارة الفريق',
    items: [
      { href: '/admin/teams',    label: 'الفرق',      icon: '🏆' },
      { href: '/admin/players',  label: 'اللاعبون',   icon: '⚽' },
      { href: '/admin/coaches',  label: 'المدربون',   icon: '👨‍💼' },
      { href: '/admin/accounts', label: 'الحسابات',   icon: '👤' },
    ],
  },
  {
    label: 'المنافسات',
    items: [
      { href: '/admin/leagues',      label: 'الدوريات',           icon: '🏅' },
      { href: '/admin/matches',      label: 'طلبات المباريات',     icon: '⚔️' },
      { href: '/admin/academies',    label: 'أكاديميات أخرى',      icon: '🤝' },
      { href: '/admin/leaderboard',  label: 'ترتيب الأكاديميات',  icon: '📊' },
    ],
  },
  {
    label: 'الأكاديمية',
    items: [
      { href: '/admin/academy-profile', label: 'ملف الأكاديمية', icon: '🏟️' },
      { href: '/admin/settings',        label: 'الإعدادات',       icon: '⚙️' },
    ],
  },
];

const coachNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/coach/team',        label: 'فريقي',               icon: '🏆' },
      { href: '/coach/matches',     label: 'المباريات',            icon: '⚔️' },
      { href: '/coach/leagues',     label: 'الدوريات',            icon: '🏅' },
      { href: '/coach/leaderboard', label: 'ترتيب الأكاديميات',   icon: '📊' },
    ],
  },
];

const playerNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: '/player/matches',     label: 'المباريات',           icon: '⚔️' },
      { href: '/player/leagues',     label: 'الدوريات',           icon: '🏅' },
      { href: '/player/leaderboard', label: 'ترتيب الأكاديميات',  icon: '📊' },
    ],
  },
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

export function Sidebar({
  role,
  userEmail,
  displayName,
  academyName,
  academyLogoUrl,
  photoUrl,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const [userPhotoError, setUserPhotoError] = useState(false);

  const navGroups =
    role === 'SUPER_ADMIN' ? superAdminNavGroups :
    role === 'ADMIN'       ? adminNavGroups       :
    role === 'COACH'       ? coachNavGroups       : playerNavGroups;

  const roleLabel =
    role === 'SUPER_ADMIN' ? 'مدير عام' :
    role === 'ADMIN'       ? 'مدير'     :
    role === 'COACH'       ? 'مدرب'     : 'لاعب';

  const sidebarTitle =
    role === 'SUPER_ADMIN' ? 'أكاديمتنا' : academyName ?? 'الأكاديمية';

  // PLAYER → /player/profile, COACH → /coach/profile, others → no link
  const profileHref =
    role === 'PLAYER' ? '/player/profile' :
    role === 'COACH'  ? '/coach/profile'  : null;

  const avatarInitial = (displayName ?? userEmail)?.[0]?.toUpperCase() ?? '?';
  const showName =
    displayName && !displayName.includes('@academy.local') && !displayName.includes('@role.local')
      ? displayName
      : userEmail;

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
        {/* ── Close button: absolute, top-left of sidebar (mobile only) ── */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 left-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          aria-label="إغلاق القائمة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* ── Header: Academy logo + name ── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-700">
          {/* Academy row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-800">
              {academyLogoUrl && !logoError ? (
                <img
                  src={academyLogoUrl}
                  alt="شعار"
                  className="w-10 h-10 object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Image src="/logo.svg" alt="شعار" width={40} height={40} className="object-contain" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate">{sidebarTitle}</div>
              <div className="text-xs text-gray-400 mt-0.5">الأكاديمية</div>
            </div>
          </div>

          {/* ── User card (below academy) — clickable for PLAYER/COACH ── */}
          <div className="mt-3">
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 transition group cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-green-600/40">
                  {photoUrl && !userPhotoError ? (
                    <img src={photoUrl} alt="الملف" className="w-10 h-10 object-cover rounded-full" onError={() => setUserPhotoError(true)} />
                  ) : (
                    <span className="text-sm font-bold text-white">{avatarInitial}</span>
                  )}
                </div>
                {/* Name + role */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition">
                    {showName}
                  </div>
                  <div className="text-xs text-green-500 mt-0.5 flex items-center gap-1">
                    <span>{roleLabel}</span>
                    <span>·</span>
                    <span>الملف الشخصي</span>
                  </div>
                </div>
                {/* Arrow hint */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition flex-shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-green-600/40">
                  {photoUrl && !userPhotoError ? (
                    <img src={photoUrl} alt="الملف" className="w-10 h-10 object-cover rounded-full" onError={() => setUserPhotoError(true)} />
                  ) : (
                    <span className="text-sm font-bold text-white">{avatarInitial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{showName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{roleLabel}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin' || item.href === '/super-admin'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                          isActive
                            ? 'bg-green-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={async () => {
              try {
                const csrfRes = await fetch('/api/auth/csrf');
                const { csrfToken } = await csrfRes.json();
                await fetch('/api/auth/signout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({ csrfToken }),
                });
              } catch {
                // ignore
              }
              window.location.href = '/login';
            }}
            className="w-full text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800 min-h-[44px]"
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
