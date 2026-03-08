'use client';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import api from '@/lib/api';
import { logout } from '@/lib/auth';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, POSITION_LABELS } from '@football-academy/shared';

const { width: SCREEN_W } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  position?: string;
  photoUrl?: string;
  team?: { name: string };
  attributes?: Record<string, number>;
  notes?: {
    id: string;
    content: string;
    createdAt: string;
    coach?: { name: string };
  }[];
}

function getRatingColor(avg: number) {
  if (avg >= 8) return '#22c55e';
  if (avg >= 6) return '#f59e0b';
  return '#ef4444';
}

function calcAvg(attrs?: Record<string, number>) {
  if (!attrs) return 5;
  const vals = ATTRIBUTE_KEYS.map((k) => attrs[k] ?? 5);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Hexagon-style rating badge (rendered as circle for RN compatibility)
function RatingBadge({ value, size = 48 }: { value: number; size?: number }) {
  const color = getRatingColor(value);
  return (
    <View
      style={[
        styles.ratingBadge,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
      ]}
    >
      <Text style={[styles.ratingText, { color, fontSize: size * 0.35 }]}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

// Horizontal attribute bar — SofaScore style
function StatBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = (value / 10) * 100;
  const color = getRatingColor(value);
  return (
    <View style={styles.statRow}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statBarWrap}>
        <View style={[styles.statBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PlayerProfileScreen() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'notes'>('stats');

  useEffect(() => {
    api
      .get('/api/players/me-player')
      .then((r) => {
        setPlayer(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>لم يتم إنشاء ملفك الشخصي بعد</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avg = calcAvg(player.attributes);
  const posLabel = player.position
    ? POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]
    : null;

  return (
    <View style={styles.root}>
      {/* ── HERO HEADER ── */}
      <View style={styles.hero}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.topBarIcon}>⬅</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>ملف اللاعب</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Photo + info row */}
        <View style={styles.heroBody}>
          {/* Left: name + position + team */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{player.name}</Text>
            {posLabel && (
              <View style={styles.positionPill}>
                <Text style={styles.positionPillText}>{posLabel}</Text>
              </View>
            )}
            {player.team && (
              <Text style={styles.heroTeam}>🏆 {player.team.name}</Text>
            )}
          </View>

          {/* Center: avatar */}
          <View style={styles.avatarWrap}>
            {player.photoUrl ? (
              <Image
                source={{ uri: player.photoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 52 }}>👤</Text>
              </View>
            )}
            {/* Rating badge overlaps bottom of avatar */}
            <View style={styles.ratingOverlay}>
              <RatingBadge value={avg} size={44} />
            </View>
          </View>
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'stats' && styles.tabItemActive]}
          onPress={() => setTab('stats')}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>
            المهارات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'notes' && styles.tabItemActive]}
          onPress={() => setTab('notes')}
        >
          <Text style={[styles.tabText, tab === 'notes' && styles.tabTextActive]}>
            ملاحظات المدربين
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {tab === 'stats' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>إحصائيات الأداء</Text>
            {ATTRIBUTE_KEYS.map((key) => (
              <StatBar
                key={key}
                label={ATTRIBUTE_LABELS[key]}
                value={player.attributes?.[key] ?? 5}
              />
            ))}
          </View>
        )}

        {tab === 'notes' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              ملاحظات المدربين ({player.notes?.length ?? 0})
            </Text>
            {!player.notes || player.notes.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد ملاحظات بعد</Text>
            ) : (
              player.notes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleDateString('ar-SA')}
                    </Text>
                    <Text style={styles.noteCoach}>{note.coach?.name ?? 'مدرب'}</Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const HERO_BG = '#1a2332';   // dark navy (like SofaScore)
const ACCENT  = '#16a34a';   // green

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: HERO_BG },
  loadingText: { color: '#94a3b8', fontSize: 14 },

  // ── Hero ──
  hero: {
    backgroundColor: HERO_BG,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  topBarIcon: { color: '#94a3b8', fontSize: 18 },
  topBarTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  heroInfo: { flex: 1, paddingBottom: 8 },
  heroName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 6,
  },
  positionPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  positionPillText: { color: '#94a3b8', fontSize: 11 },
  heroTeam: { color: '#64748b', fontSize: 12, textAlign: 'right' },

  avatarWrap: { alignItems: 'center', marginLeft: 20 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#334155',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#253043',
    borderWidth: 3,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingOverlay: {
    marginTop: -16,
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  ratingText: { fontWeight: '800' },

  // ── Tabs ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: ACCENT },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  // ── Content ──
  scrollArea: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },

  // ── Stat bars ──
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statValue: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'left',
  },
  statBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  statBarFill: { height: 6, borderRadius: 3 },
  statLabel: {
    width: 72,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },

  // ── Notes ──
  noteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteCoach: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  noteDate: { fontSize: 11, color: '#94a3b8' },
  noteContent: { fontSize: 13, color: '#374151', lineHeight: 20, textAlign: 'right' },

  // ── Misc ──
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoutBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});
