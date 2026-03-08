import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import api from '@/lib/api';
import { logout } from '@/lib/auth';
import { POSITION_LABELS } from '@football-academy/shared';

const { width: SCREEN_W } = Dimensions.get('window');
const PITCH_W = SCREEN_W - 32;
const PITCH_H = PITCH_W * 1.45;

// ── Types ──────────────────────────────────────────────
interface PlayerAttrs {
  speed: number; passing: number; shooting: number;
  dribbling: number; defense: number; stamina: number;
}

interface Player {
  id: string;
  name: string;
  position?: string;
  photoUrl?: string;
  attributes?: PlayerAttrs;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

// ── Helpers ────────────────────────────────────────────
function avgRating(attrs?: PlayerAttrs) {
  if (!attrs) return 5;
  const vals = [attrs.speed, attrs.passing, attrs.shooting, attrs.dribbling, attrs.defense, attrs.stamina];
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function ratingColor(avg: number) {
  if (avg >= 8) return '#22c55e';
  if (avg >= 6) return '#f59e0b';
  return '#ef4444';
}

// Group players by position for the formation layout
function groupByPosition(players: Player[]) {
  const groups: Record<string, Player[]> = {
    GOALKEEPER: [],
    DEFENDER: [],
    MIDFIELDER: [],
    FORWARD: [],
    UNASSIGNED: [],
  };
  players.forEach((p) => {
    const key = p.position && groups[p.position] ? p.position : 'UNASSIGNED';
    groups[key].push(p);
  });
  return groups;
}

// ── PlayerDot ──────────────────────────────────────────
// The round photo pin shown on the pitch (like SofaScore)
function PlayerDot({
  player,
  onPress,
}: {
  player: Player;
  onPress: () => void;
}) {
  const avg = avgRating(player.attributes);
  const color = ratingColor(avg);
  const shortName = player.name.split(' ')[0]; // first name only on pitch

  return (
    <TouchableOpacity style={styles.dotWrap} onPress={onPress} activeOpacity={0.8}>
      {/* Photo circle */}
      <View style={[styles.dotRing, { borderColor: color }]}>
        {player.photoUrl ? (
          <Image source={{ uri: player.photoUrl }} style={styles.dotPhoto} />
        ) : (
          <View style={styles.dotPhotoPlaceholder}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </View>
        )}
      </View>
      {/* Rating badge */}
      <View style={[styles.dotRating, { backgroundColor: color }]}>
        <Text style={styles.dotRatingText}>{avg.toFixed(1)}</Text>
      </View>
      {/* Name below */}
      <Text style={styles.dotName} numberOfLines={1}>{shortName}</Text>
    </TouchableOpacity>
  );
}

// ── A row of PlayerDots across the pitch ──────────────
function PitchRow({
  players,
  onPress,
}: {
  players: Player[];
  onPress: (p: Player) => void;
}) {
  return (
    <View style={styles.pitchRow}>
      {players.map((p) => (
        <PlayerDot key={p.id} player={p} onPress={() => onPress(p)} />
      ))}
    </View>
  );
}

// ── Player Detail Modal ────────────────────────────────
function PlayerModal({
  player,
  visible,
  onClose,
}: {
  player: Player | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!player) return null;
  const avg = avgRating(player.attributes);
  const color = ratingColor(avg);
  const attrs = player.attributes;

  const statKeys: Array<{ key: keyof PlayerAttrs; label: string }> = [
    { key: 'speed', label: 'السرعة' },
    { key: 'passing', label: 'التمرير' },
    { key: 'shooting', label: 'التسديد' },
    { key: 'dribbling', label: 'المراوغة' },
    { key: 'defense', label: 'الدفاع' },
    { key: 'stamina', label: 'التحمل' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        {/* Handle */}
        <View style={styles.modalHandle} />

        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalAvatarWrap}>
            {player.photoUrl ? (
              <Image source={{ uri: player.photoUrl }} style={styles.modalAvatar} />
            ) : (
              <View style={[styles.modalAvatar, styles.modalAvatarPlaceholder]}>
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
            )}
            <View style={[styles.modalRatingBadge, { borderColor: color }]}>
              <Text style={[styles.modalRatingText, { color }]}>{avg.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.modalPlayerInfo}>
            <Text style={styles.modalName}>{player.name}</Text>
            {player.position && (
              <Text style={styles.modalPosition}>
                {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.modalStats}>
          {statKeys.map(({ key, label }) => {
            const val = attrs?.[key] ?? 5;
            const pct = (val / 10) * 100;
            const c = ratingColor(val);
            return (
              <View key={key} style={styles.modalStatRow}>
                <Text style={styles.modalStatVal}>{val}</Text>
                <View style={styles.modalStatBar}>
                  <View style={[styles.modalStatFill, { width: `${pct}%` as any, backgroundColor: c }]} />
                </View>
                <Text style={styles.modalStatLabel}>{label}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.modalCloseBtn}
          onPress={onClose}
        >
          <Text style={styles.modalCloseBtnText}>إغلاق</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────
export default function CoachTeamScreen() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Player | null>(null);

  useEffect(() => {
    api.get('/api/coach/my-team').then((r) => {
      setTeam(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.emptyText}>لم يتم تعيينك في فريق بعد</Text>
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: 24 }}>
          <Text style={{ color: '#ef4444' }}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groups = groupByPosition(team.players);

  // Formation rows from top to bottom (attacking to defending, like SofaScore portrait view)
  const rows = [
    groups.FORWARD,
    groups.MIDFIELDER,
    groups.DEFENDER,
    groups.GOALKEEPER,
  ].filter((row) => row.length > 0);

  const unassigned = groups.UNASSIGNED;

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.topBarIcon}>🚪</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{team.name}</Text>
        <Text style={styles.topBarCount}>{team.players.length} لاعب</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Pitch ── */}
        <View style={styles.pitchOuter}>
          {/* Green pitch surface */}
          <View style={styles.pitch}>
            {/* Pitch markings */}
            <View style={styles.pitchCenterLine} />
            <View style={styles.pitchCenterCircle} />
            <View style={styles.pitchTopBox} />
            <View style={styles.pitchBottomBox} />

            {/* Player rows */}
            <View style={styles.pitchContent}>
              {rows.map((rowPlayers, i) => (
                <PitchRow
                  key={i}
                  players={rowPlayers}
                  onPress={setSelected}
                />
              ))}
            </View>
          </View>

          {/* Unassigned players (no position set) */}
          {unassigned.length > 0 && (
            <View style={styles.benchWrap}>
              <Text style={styles.benchTitle}>بدون مركز ({unassigned.length})</Text>
              <View style={styles.benchRow}>
                {unassigned.map((p) => (
                  <PlayerDot key={p.id} player={p} onPress={() => setSelected(p)} />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Player list below pitch ── */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>قائمة اللاعبين</Text>
          {team.players.map((p) => {
            const avg = avgRating(p.attributes);
            const color = ratingColor(avg);
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.listRow}
                onPress={() => setSelected(p)}
              >
                <View style={[styles.listRating, { backgroundColor: color }]}>
                  <Text style={styles.listRatingText}>{avg.toFixed(1)}</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{p.name}</Text>
                  {p.position && (
                    <Text style={styles.listPos}>
                      {POSITION_LABELS[p.position as keyof typeof POSITION_LABELS]}
                    </Text>
                  )}
                </View>
                {p.photoUrl ? (
                  <Image source={{ uri: p.photoUrl }} style={styles.listPhoto} />
                ) : (
                  <View style={[styles.listPhoto, styles.listPhotoPlaceholder]}>
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Player detail modal */}
      <PlayerModal
        player={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────
const PITCH_GREEN      = '#2d7a2f';
const PITCH_LINE       = 'rgba(255,255,255,0.35)';
const DARK_BG          = '#0f172a';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK_BG },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: DARK_BG,
  },
  topBarIcon: { fontSize: 18 },
  topBarTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  topBarCount: { color: '#64748b', fontSize: 13 },

  // Pitch container
  pitchOuter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  pitch: {
    width: PITCH_W,
    height: PITCH_H,
    backgroundColor: PITCH_GREEN,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pitchCenterLine: {
    position: 'absolute',
    top: PITCH_H / 2 - 0.5,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: PITCH_LINE,
  },
  pitchCenterCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: PITCH_LINE,
    top: PITCH_H / 2 - 35,
    left: PITCH_W / 2 - 35,
  },
  pitchTopBox: {
    position: 'absolute',
    top: 10,
    left: PITCH_W * 0.2,
    right: PITCH_W * 0.2,
    height: PITCH_H * 0.13,
    borderWidth: 1.5,
    borderColor: PITCH_LINE,
    borderTopWidth: 0,
  },
  pitchBottomBox: {
    position: 'absolute',
    bottom: 10,
    left: PITCH_W * 0.2,
    right: PITCH_W * 0.2,
    height: PITCH_H * 0.13,
    borderWidth: 1.5,
    borderColor: PITCH_LINE,
    borderBottomWidth: 0,
  },
  pitchContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  // Player dot on pitch
  dotWrap: { alignItems: 'center', width: 68 },
  dotRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  dotPhoto: { width: 52, height: 52, borderRadius: 26 },
  dotPhotoPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#253043',
    justifyContent: 'center', alignItems: 'center',
  },
  dotRating: {
    position: 'absolute',
    top: 36,
    right: 8,
    minWidth: 22,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotRatingText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  dotName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Bench / unassigned
  benchWrap: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
  },
  benchTitle: { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 10, textAlign: 'right' },
  benchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },

  // List section
  listSection: {
    margin: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
    marginTop: 12,
  },
  listTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  listRating: {
    width: 38,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  listRatingText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  listInfo: { flex: 1, alignItems: 'flex-end' },
  listName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  listPos: { color: '#64748b', fontSize: 11, marginTop: 2 },
  listPhoto: { width: 38, height: 38, borderRadius: 19, marginRight: 0 },
  listPhotoPlaceholder: {
    backgroundColor: '#253043',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalAvatarWrap: { position: 'relative', marginLeft: 16 },
  modalAvatar: { width: 72, height: 72, borderRadius: 36 },
  modalAvatarPlaceholder: {
    backgroundColor: '#253043',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRatingBadge: {
    position: 'absolute',
    bottom: -4, right: -4,
    width: 30, height: 30,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRatingText: { fontSize: 10, fontWeight: '800' },
  modalPlayerInfo: { flex: 1, alignItems: 'flex-end' },
  modalName: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  modalPosition: { color: '#64748b', fontSize: 13, marginTop: 4 },

  modalStats: { marginBottom: 20 },
  modalStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalStatVal: { width: 28, color: '#f1f5f9', fontSize: 13, fontWeight: '700', textAlign: 'left' },
  modalStatBar: {
    flex: 1, height: 6,
    backgroundColor: '#334155',
    borderRadius: 3, overflow: 'hidden',
    marginHorizontal: 10,
  },
  modalStatFill: { height: 6, borderRadius: 3 },
  modalStatLabel: { width: 68, color: '#64748b', fontSize: 12, textAlign: 'right' },

  modalCloseBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
});
