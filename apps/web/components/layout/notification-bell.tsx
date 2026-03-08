'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  NEW_MATCH:       '⚔️',
  MATCH_ACCEPTED:  '✅',
  MATCH_REJECTED:  '❌',
  MATCH_RESULT:    '🏆',
  NEW_TEAM:        '🏆',
  NEW_COACH:       '👨‍💼',
  NEW_SESSION:     '📋',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export function NotificationBell() {
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const ref                       = useRef<HTMLDivElement>(null);
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + poll every 30 s
  useEffect(() => {
    fetchNotifs();
    pollRef.current = setInterval(() => fetchNotifs(true), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function markOneRead(id: string) {
    await fetch('/api/notifications/read', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifs(); }}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        title="الإشعارات"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800 text-sm">الإشعارات</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 transition">
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">جارٍ التحميل...</div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <div className="text-3xl mb-2">🔔</div>
                لا توجد إشعارات
              </div>
            ) : notifs.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/60' : ''}`}
                onClick={() => {
                  if (!n.isRead) markOneRead(n.id);
                  if (n.link) { setOpen(false); window.location.href = n.link; }
                }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-semibold leading-tight ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </span>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {notifs.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 text-center">
              <span className="text-xs text-gray-400">آخر {notifs.length} إشعار</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
