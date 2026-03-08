'use client';

import { useState, useEffect } from 'react';

interface Exercise {
  name: string;
  duration: string;
  notes: string;
}

interface SessionPlan {
  id: string;
  title: string;
  date: string;
  description: string | null;
  exercises: Exercise[];
  targetGroupId: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface Props {
  coachId: string;
  teamId: string;
  groups: Group[];
}

const emptyForm = {
  title: '',
  date: '',
  description: '',
  targetGroupId: '',
  exercises: [{ name: '', duration: '', notes: '' }] as Exercise[],
};

function formatDateAr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionsTab({ groups }: Props) {
  const [sessions, setSessions] = useState<SessionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, exercises: [{ name: '', duration: '', notes: '' }] });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/coach/sessions');
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSessions(); }, []);

  function openCreate() {
    setForm({ ...emptyForm, exercises: [{ name: '', duration: '', notes: '' }] });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(session: SessionPlan) {
    setForm({
      title: session.title,
      date: session.date.split('T')[0],
      description: session.description ?? '',
      targetGroupId: session.targetGroupId ?? '',
      exercises: session.exercises.length > 0
        ? session.exercises
        : [{ name: '', duration: '', notes: '' }],
    });
    setEditingId(session.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function addExercise() {
    setForm((p) => ({ ...p, exercises: [...p.exercises, { name: '', duration: '', notes: '' }] }));
  }

  function removeExercise(i: number) {
    setForm((p) => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));
  }

  function updateExercise(i: number, field: keyof Exercise, value: string) {
    setForm((p) => {
      const exs = [...p.exercises];
      exs[i] = { ...exs[i], [field]: value };
      return { ...p, exercises: exs };
    });
  }

  async function save() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const cleanedExercises = form.exercises.filter((e) => e.name.trim());
      const body = {
        title: form.title.trim(),
        date: form.date,
        description: form.description.trim() || null,
        exercises: cleanedExercises,
        targetGroupId: form.targetGroupId || null,
      };

      const res = editingId
        ? await fetch(`/api/coach/sessions/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/coach/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        await fetchSessions();
        cancelForm();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/coach/sessions/${id}`, { method: 'DELETE' });
      await fetchSessions();
    } finally {
      setDeletingId(null);
    }
  }

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.date) >= now);
  const past = sessions.filter((s) => new Date(s.date) < now);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">خطط التدريب</h2>
        {!showForm && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition"
          >
            + إضافة جلسة
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">
            {editingId ? 'تعديل الجلسة' : 'جلسة تدريبية جديدة'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">عنوان الجلسة *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثال: تدريب الثلاثاء"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تاريخ الجلسة *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Target group */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">المجموعة المستهدفة (اختياري)</label>
            <select
              value={form.targetGroupId}
              onChange={(e) => setForm((p) => ({ ...p, targetGroupId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">الكل (جميع اللاعبين)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">وصف الجلسة (اختياري)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="أهداف الجلسة، ملاحظات عامة..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Exercises */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">التمارين</label>
            <div className="space-y-2">
              {form.exercises.map((ex, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      placeholder="اسم التمرين"
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      value={ex.duration}
                      onChange={(e) => updateExercise(i, 'duration', e.target.value)}
                      placeholder="المدة (دقيقة)"
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      value={ex.notes}
                      onChange={(e) => updateExercise(i, 'notes', e.target.value)}
                      placeholder="ملاحظات"
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  {form.exercises.length > 1 && (
                    <button
                      onClick={() => removeExercise(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none mt-1 flex-shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              + إضافة تمرين
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || !form.title.trim() || !form.date}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition"
            >
              {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الجلسة'}
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

      {/* Sessions list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">جاري التحميل...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-400 text-sm">لا توجد جلسات بعد. أضف جلستك الأولى!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                القادمة ({upcoming.length})
              </div>
              {upcoming.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  groups={groups}
                  onEdit={() => openEdit(session)}
                  onDelete={() => deleteSession(session.id)}
                  deleting={deletingId === session.id}
                  isUpcoming
                />
              ))}
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-200 pt-4 mt-4">
                السابقة ({past.length})
              </div>
              {past.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  groups={groups}
                  onEdit={() => openEdit(session)}
                  onDelete={() => deleteSession(session.id)}
                  deleting={deletingId === session.id}
                  isUpcoming={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  groups,
  onEdit,
  onDelete,
  deleting,
  isUpcoming,
}: {
  session: SessionPlan;
  groups: Group[];
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  isUpcoming: boolean;
}) {
  const targetGroup = groups.find((g) => g.id === session.targetGroupId);

  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-3 ${
        isUpcoming ? 'border-green-200' : 'border-gray-200 opacity-75'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg px-3 py-2 text-center flex-shrink-0 min-w-[56px] ${
            isUpcoming ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className={`text-xs font-medium ${isUpcoming ? 'text-green-600' : 'text-gray-400'}`}>
            {new Date(session.date).toLocaleDateString('ar-SA', { month: 'short' })}
          </div>
          <div className={`text-xl font-bold leading-none ${isUpcoming ? 'text-green-700' : 'text-gray-400'}`}>
            {new Date(session.date).getDate()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
            {targetGroup && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                👥 {targetGroup.name}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date(session.date).toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            تعديل
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
          >
            {deleting ? '...' : 'حذف'}
          </button>
        </div>
      </div>

      {session.description && (
        <p className="text-sm text-gray-600">{session.description}</p>
      )}

      {session.exercises.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {session.exercises.map((ex, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
              {ex.name}{ex.duration ? ` — ${ex.duration} دق` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
