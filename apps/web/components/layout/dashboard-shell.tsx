'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { NotificationBell } from './notification-bell';

interface DashboardShellProps {
  children: React.ReactNode;
  role: string;
  userEmail: string;
  displayName?: string;
  academyName?: string;
  academyLogoUrl?: string | null;
  photoUrl?: string | null;
}

export function DashboardShell({
  children,
  role,
  userEmail,
  displayName,
  academyName,
  academyLogoUrl,
  photoUrl,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        userEmail={userEmail}
        displayName={displayName}
        academyName={academyName}
        academyLogoUrl={academyLogoUrl}
        photoUrl={photoUrl}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 lg:mr-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="فتح القائمة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Academy name + logo — mobile center */}
          <div className="lg:hidden flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
            {academyLogoUrl && (
              <img
                src={academyLogoUrl}
                alt=""
                className="w-6 h-6 rounded-md object-cover flex-shrink-0"
              />
            )}
            {academyName && (
              <span className="text-sm font-semibold text-gray-700 truncate">
                {academyName}
              </span>
            )}
          </div>

          {/* Desktop spacer */}
          <div className="hidden lg:block flex-1" />

          <NotificationBell />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
