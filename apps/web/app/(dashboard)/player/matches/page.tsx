import { MatchesList } from '@/components/matches/matches-list';

export default function PlayerMatchesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">مباريات أكاديميتي</h1>
      <p className="text-sm text-gray-500 mb-8">المباريات المؤكدة لفئتك العمرية</p>
      <MatchesList apiUrl="/api/player/matches" />
    </div>
  );
}
