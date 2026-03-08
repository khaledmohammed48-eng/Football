'use client';

interface Exercise {
  name: string;
  duration: string;
  notes: string;
}

interface Session {
  id: string;
  title: string;
  date: string;
  description?: string | null;
  exercises: Exercise[];
  targetGroupId?: string | null;
  coachName?: string;
  teamName?: string;
}

interface Props {
  sessions: Session[];
  showCoachName?: boolean;
  showTeamName?: boolean;
}

function formatDateAr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function SessionPlanViewer({ sessions, showCoachName, showTeamName }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-gray-400 text-sm">لا توجد جلسات تدريبية قادمة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center flex-shrink-0 min-w-[60px]">
              <div className="text-xs text-green-600 font-medium">
                {new Date(session.date).toLocaleDateString('ar-SA', { month: 'short' })}
              </div>
              <div className="text-xl font-bold text-green-700 leading-none">
                {new Date(session.date).getDate()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
              <div className="text-xs text-gray-400 mt-0.5">
                {formatDateAr(session.date)}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {showCoachName && session.coachName && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    👨‍💼 {session.coachName}
                  </span>
                )}
                {showTeamName && session.teamName && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    🏆 {session.teamName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {session.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{session.description}</p>
          )}

          {/* Exercises */}
          {session.exercises.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                التمارين
              </div>
              <div className="space-y-1.5">
                {session.exercises.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="font-medium text-gray-800">{ex.name}</span>
                    {ex.duration && (
                      <span className="text-gray-400 text-xs flex-shrink-0">— {ex.duration} دق</span>
                    )}
                    {ex.notes && (
                      <span className="text-gray-500 text-xs truncate">{ex.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
