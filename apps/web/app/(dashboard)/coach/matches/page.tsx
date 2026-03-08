import { MatchesList } from '@/components/matches/matches-list';

export default function CoachMatchesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">مباريات الأكاديمية</h1>
      <p className="text-sm text-gray-500 mb-8">المباريات المؤكدة مع الأكاديميات الأخرى</p>
      <MatchesList apiUrl="/api/coach/matches" showLineup />
    </div>
  );
}
