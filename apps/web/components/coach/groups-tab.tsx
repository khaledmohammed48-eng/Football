'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
}

interface TrainingGroup {
  id: string;
  name: string;
  type: string;
  playerIds: string[];
  captainId: string | null;
  formation: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  players: Player[];
  coachId: string;
  teamId: string;
}

const FORMATION_OPTIONS = [
  { key: '', label: '— بدون تشكيلة —' },
  { key: '6: 1-2-2', label: '6 لاعبين — 1-2-2' },
  { key: '6: 1-3-1', label: '6 لاعبين — 1-3-1' },
  { key: '6: 2-2-1', label: '6 لاعبين — 2-2-1' },
  { key: '8: 2-3-2', label: '8 لاعبين — 2-3-2' },
  { key: '8: 3-3-1', label: '8 لاعبين — 3-3-1' },
  { key: '8: 2-4-1', label: '8 لاعبين — 2-4-1' },
  { key: '11: 4-3-3', label: '11 لاعباً — 4-3-3' },
  { key: '11: 4-4-2', label: '11 لاعباً — 4-4-2' },
  { key: '11: 4-2-3-1', label: '11 لاعباً — 4-2-3-1' },
  { key: '11: 3-5-2', label: '11 لاعباً — 3-5-2' },
];

const emptyForm = {
  name: '',
  type: 'TEMPORARY',
  playerIds: [] as string[],
  captainId: '' as string,
  formation: '' as string,
};

export function GroupsTab({ players }: Props) {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch('/api/coach/groups');
      if (res.ok) setGroups(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGroups(); }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(group: TrainingGroup) {
    setForm({
      name: group.name,
      type: group.type,
      playerIds: [...group.playerIds],
      captainId: group.captainId ?? '',
      formation: group.formation ?? '',
    });
    setEditingId(group.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function togglePlayer(id: string) {
    setForm((prev) => {
      const ids = prev.playerIds.includes(id)
        ? prev.playerIds.filter((x) => x !== id)
        : [...prev.playerIds, id];
      // If captain is removed from the group, clear captain
      const captainId = ids.includes(prev.captainId) ? prev.captainId : '';
      return { ...prev, playerIds: ids, captainId };
    });
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        playerIds: form.playerIds,
        captainId: form.captainId || null,
        formation: form.formation || null,
      };

      const res = editingId
        ? await fetch(`/api/coach/groups/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/coach/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        await fetchGroups();
        cancelForm();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/coach/groups/${id}`, { method: 'DELETE' });
      await fetchGroups();
    } finally {
      setDeletingId(null);
    }
  }

  const selectedPlayers = players.filter((p) => form.playerIds.includes(p.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">مجموعات التدريب</h2>
        {!showForm && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition"
          >
            + إنشاء مجموعة
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">
            {editingId ? 'تعديل المجموعة' : 'مجموعة جديدة'}
          </h3>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">اسم المجموعة *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="مثال: المجموعة أ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">نوع المجموعة</label>
            <div className="flex gap-3">
              {[
                { value: 'TEMPORARY', label: 'مؤقتة' },
                { value: 'PERMANENT', label: 'دائمة' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={form.type === value}
                    onChange={() => setForm((p) => ({ ...p, type: value }))}
                    className="text-green-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formation */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">التشكيلة (اختياري)</label>
            <select
              value={form.formation}
              onChange={(e) => setForm((p) => ({ ...p, formation: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {FORMATION_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Player selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              اختر اللاعبين ({form.playerIds.length} مختار)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {players.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.playerIds.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="text-green-600 rounded"
                  />
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-7 h-7 object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-green-700">{player.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-800">{player.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Captain selection */}
          {selectedPlayers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ⭐ القائد (اختياري)
              </label>
              <select
                value={form.captainId}
                onChange={(e) => setForm((p) => ({ ...p, captainId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— بدون قائد —</option>
                {selectedPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition"
            >
              {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إنشاء المجموعة'}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">جاري التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-gray-400 text-sm">لا توجد مجموعات بعد. أنشئ مجموعتك الأولى!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupPlayers = players.filter((p) => group.playerIds.includes(p.id));
            const captain = players.find((p) => p.id === group.captainId);

            return (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          group.type === 'PERMANENT'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {group.type === 'PERMANENT' ? 'دائمة' : 'مؤقتة'}
                      </span>
                      {group.formation && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          ⚽ {group.formation.split(': ')[1] ?? group.formation}
                        </span>
                      )}
                    </div>
                    {captain && (
                      <div className="text-xs text-gray-500 mt-1">
                        ⭐ القائد: <span className="font-medium text-gray-700">{captain.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(group)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      disabled={deletingId === group.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                    >
                      {deletingId === group.id ? '...' : 'حذف'}
                    </button>
                  </div>
                </div>

                {/* Player avatars */}
                <div className="flex flex-wrap gap-2">
                  {groupPlayers.length === 0 ? (
                    <span className="text-xs text-gray-400">لا يوجد لاعبون في هذه المجموعة</span>
                  ) : (
                    groupPlayers.map((p) => (
                      <div key={p.id} className="relative flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green-100 overflow-hidden border-2 border-white shadow flex items-center justify-center">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} className="w-9 h-9 object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-green-700">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        {p.id === group.captainId && (
                          <span className="absolute -top-1 -right-1 text-xs leading-none">⭐</span>
                        )}
                        <span className="text-xs text-gray-500 mt-0.5 max-w-[48px] truncate text-center">
                          {p.name.split(' ')[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
