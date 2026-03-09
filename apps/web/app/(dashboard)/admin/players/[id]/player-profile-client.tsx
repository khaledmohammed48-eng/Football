'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_COLORS,
  POSITION_LABELS,
  POSITION_VALUES,
} from '@football-academy/shared';
import { ImageViewer } from '@/components/ui/image-viewer';

interface Team { id: string; name: string; }

interface PlayerProfileClientProps {
  player: {
    id: string;
    name: string;
    photoUrl?: string | null;
    dateOfBirth?: string | null;
    position?: string | null;
    phone?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    teamId?: string | null;
    team?: { id: string; name: string } | null;
    subscriptionEnd?: string | null;
    attributes?: {
      speed: number; passing: number; shooting: number;
      dribbling: number; defense: number; stamina: number;
      heading: number; overall: number; leftFoot: number; rightFoot: number;
    } | null;
    notes?: { id: string; content: string; createdAt: string; coach?: { name: string } }[];
  };
  teams: Team[];
  isAdmin?: boolean;
  coachId?: string;
}

// Returns true if subscription is expired
function isExpired(subscriptionEnd?: string | null): boolean {
  if (!subscriptionEnd) return false;
  return new Date(subscriptionEnd) < new Date();
}

// Days remaining (negative = expired)
function daysRemaining(subscriptionEnd?: string | null): number | null {
  if (!subscriptionEnd) return null;
  const diff = new Date(subscriptionEnd).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function PlayerProfileClient({ player, teams, isAdmin, coachId }: PlayerProfileClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'bio' | 'skills' | 'notes'>('bio');

  // Bio form
  const [bio, setBio] = useState({
    name: player.name,
    dateOfBirth: player.dateOfBirth ? player.dateOfBirth.substring(0, 10) : '',
    position: player.position ?? '',
    phone: player.phone ?? '',
    guardianName: player.guardianName ?? '',
    guardianPhone: player.guardianPhone ?? '',
    teamId: player.teamId ?? '',
    subscriptionEnd: player.subscriptionEnd ? player.subscriptionEnd.substring(0, 10) : '',
  });

  const expired = isExpired(player.subscriptionEnd);
  const days = daysRemaining(player.subscriptionEnd);
  const [savingBio, setSavingBio] = useState(false);

  // Skills — only keep the 10 numeric skill fields (strip id/playerId/updatedAt)
  const defaultAttrs = {
    speed: 5, passing: 5, shooting: 5, dribbling: 5, defense: 5, stamina: 5,
    heading: 5, overall: 5, leftFoot: 5, rightFoot: 5,
  };
  const [attrs, setAttrs] = useState<Record<string, number>>({
    ...defaultAttrs,
    ...(player.attributes
      ? {
          speed: player.attributes.speed,
          passing: player.attributes.passing,
          shooting: player.attributes.shooting,
          dribbling: player.attributes.dribbling,
          defense: player.attributes.defense,
          stamina: player.attributes.stamina,
          heading: player.attributes.heading,
          overall: player.attributes.overall,
          leftFoot: player.attributes.leftFoot,
          rightFoot: player.attributes.rightFoot,
        }
      : {}),
  });
  const [savingAttrs, setSavingAttrs] = useState(false);
  const [attrsSaved, setAttrsSaved] = useState(false);

  // Notes
  const [notes, setNotes] = useState(player.notes ?? []);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Photo
  const [photoUrl, setPhotoUrl] = useState(player.photoUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);

  async function saveBio(e: React.FormEvent) {
    e.preventDefault();
    setSavingBio(true);
    await fetch(`/api/players/${player.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bio,
        teamId: bio.teamId || null,
        position: bio.position || null,
        subscriptionEnd: bio.subscriptionEnd || null,
      }),
    });
    setSavingBio(false);
    router.refresh();
  }

  async function saveAttrs() {
    setSavingAttrs(true);
    // Only send the 10 skill fields — no extra fields
    const payload = {
      speed: attrs.speed,
      passing: attrs.passing,
      shooting: attrs.shooting,
      dribbling: attrs.dribbling,
      defense: attrs.defense,
      stamina: attrs.stamina,
      heading: attrs.heading,
      overall: attrs.overall,
      leftFoot: attrs.leftFoot,
      rightFoot: attrs.rightFoot,
    };
    const res = await fetch(`/api/players/${player.id}/attributes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSavingAttrs(false);
    if (res.ok) {
      setAttrsSaved(true);
      setTimeout(() => setAttrsSaved(false), 2500);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/players/${player.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteText }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes([note, ...notes]);
      setNoteText('');
    }
    setAddingNote(false);
  }

  async function deleteNote(noteId: string) {
    if (!confirm('حذف الملاحظة؟')) return;
    await fetch(`/api/players/${player.id}/notes/${noteId}`, { method: 'DELETE' });
    setNotes(notes.filter((n) => n.id !== noteId));
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      // Update the player record with the new photo URL
      const saveRes = await fetch(`/api/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: url }),
      });
      if (saveRes.ok) {
        setPhotoUrl(url);
      } else {
        const err = await saveRes.json();
        alert('فشل حفظ الصورة: ' + (err.error ?? 'خطأ غير معروف'));
      }
    } else {
      const err = await uploadRes.json();
      alert('فشل رفع الصورة: ' + (err.error ?? 'خطأ غير معروف'));
    }
    setUploading(false);
  }

  const tabClass = (t: string) =>
    `px-4 py-2.5 text-sm font-medium rounded-lg transition ${
      tab === t ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      {/* Full-screen image viewer */}
      {viewingPhoto && photoUrl && (
        <ImageViewer
          src={photoUrl}
          alt={player.name}
          onClose={() => setViewingPhoto(false)}
        />
      )}

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Player Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          {/* Clickable avatar */}
          <div
            className={`w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-4xl overflow-hidden ${photoUrl ? 'cursor-pointer ring-2 ring-transparent hover:ring-green-400 transition' : ''}`}
            onClick={() => photoUrl && setViewingPhoto(true)}
            title={photoUrl ? 'انقر لعرض الصورة' : ''}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={player.name} className="w-24 h-24 object-cover rounded-full" />
            ) : '⚽'}
          </div>
          {isAdmin && (
            <label className="absolute bottom-0 left-0 bg-white border border-gray-200 rounded-full p-1 cursor-pointer hover:bg-gray-50 transition">
              <span className="text-xs">📷</span>
              <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
            </label>
          )}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{player.name}</h2>

        {/* Active / Inactive badge */}
        {expired ? (
          <span className="mt-1 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
            ❌ غير نشط — انتهى الاشتراك
          </span>
        ) : (
          <span className="mt-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
            ✅ نشط
          </span>
        )}

        {/* Subscription info (admin & coach only) */}
        {(isAdmin || coachId) && player.subscriptionEnd && (
          <div className={`mt-2 text-xs px-2.5 py-1 rounded-full ${
            expired
              ? 'bg-red-50 text-red-600'
              : days !== null && days <= 30
                ? 'bg-orange-50 text-orange-600'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {expired
              ? `انتهى منذ ${Math.abs(days!)} يوم`
              : days === 0
                ? 'ينتهي اليوم!'
                : `ينتهي خلال ${days} يوم`}
          </div>
        )}

        {player.position && (
          <span className="mt-2 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
          </span>
        )}
        {player.team && (
          <span className="mt-2 text-xs text-gray-500">{player.team.name}</span>
        )}
        {uploading && <span className="text-xs text-gray-400 mt-2">جاري الرفع...</span>}
      </div>

      {/* Tabs */}
      <div className="lg:col-span-3">
        <div className="flex gap-2 mb-6">
          <button className={tabClass('bio')} onClick={() => setTab('bio')}>معلومات اللاعب</button>
          <button className={tabClass('skills')} onClick={() => setTab('skills')}>المهارات</button>
          <button className={tabClass('notes')} onClick={() => setTab('notes')}>
            ملاحظات المدربين ({notes.length})
          </button>
        </div>

        {/* Bio Tab */}
        {tab === 'bio' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={saveBio} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <input
                  value={bio.name}
                  onChange={(e) => setBio({ ...bio, name: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={bio.dateOfBirth}
                  onChange={(e) => setBio({ ...bio, dateOfBirth: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المركز</label>
                <select
                  value={bio.position}
                  onChange={(e) => setBio({ ...bio, position: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر المركز</option>
                  {POSITION_VALUES.map((p) => (
                    <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفريق</label>
                <select
                  value={bio.teamId}
                  onChange={(e) => setBio({ ...bio, teamId: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">بدون فريق</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  value={bio.phone}
                  onChange={(e) => setBio({ ...bio, phone: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم ولي الأمر</label>
                <input
                  value={bio.guardianName}
                  onChange={(e) => setBio({ ...bio, guardianName: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هاتف ولي الأمر</label>
                <input
                  value={bio.guardianPhone}
                  onChange={(e) => setBio({ ...bio, guardianPhone: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {/* Subscription date — admin only */}
              {isAdmin && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ انتهاء الاشتراك
                    <span className="text-xs text-gray-400 mr-2">(يظهر للمدربين والإدارة فقط)</span>
                  </label>
                  <input
                    type="date"
                    value={bio.subscriptionEnd}
                    onChange={(e) => setBio({ ...bio, subscriptionEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {bio.subscriptionEnd && (
                    <button
                      type="button"
                      onClick={() => setBio({ ...bio, subscriptionEnd: '' })}
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                    >
                      × إزالة تاريخ الانتهاء
                    </button>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingBio}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
                  >
                    {savingBio ? 'جاري الحفظ...' : 'حفظ المعلومات'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Skills Tab */}
        {tab === 'skills' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-5">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{ATTRIBUTE_LABELS[key]}</label>
                    <span className="text-sm font-bold" style={{ color: ATTRIBUTE_COLORS[key] }}>
                      {attrs[key]}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={attrs[key]}
                    onChange={(e) => setAttrs({ ...attrs, [key]: parseInt(e.target.value) })}
                    disabled={!isAdmin && !coachId}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: ATTRIBUTE_COLORS[key] }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                        <div
                          key={v}
                          className="w-4 h-1.5 rounded-sm"
                          style={{
                            backgroundColor: v <= attrs[key] ? ATTRIBUTE_COLORS[key] : '#e5e7eb',
                          }}
                        />
                      ))}
                    </div>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>
            {(isAdmin || coachId) && (
              <button
                onClick={saveAttrs}
                disabled={savingAttrs}
                className="mt-6 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
              >
                {savingAttrs ? 'جاري الحفظ...' : attrsSaved ? '✅ تم الحفظ' : 'حفظ المهارات'}
              </button>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {tab === 'notes' && (
          <div className="space-y-4">
            {(isAdmin || coachId) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <form onSubmit={addNote} className="flex flex-col gap-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || noteText.length < 5}
                    className="self-start bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium px-5 py-2 rounded-lg text-sm transition"
                  >
                    {addingNote ? 'جاري الإضافة...' : 'إضافة ملاحظة'}
                  </button>
                </form>
              </div>
            )}

            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-200">
                لا توجد ملاحظات بعد
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {note.coach?.name ?? 'مدرب'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                        {(isAdmin || coachId) && (
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-red-400 hover:text-red-600 text-xs transition"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
