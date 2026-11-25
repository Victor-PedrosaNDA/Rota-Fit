import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SpotifyPlayerCard } from '@/components/spotify/SpotifyPlayerCard';
import { useAuth } from '@/context/AuthContext';
import { useWeeklyStats } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/geo';
import { greetingForHour } from '@/utils/greeting';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { data: stats } = useWeeklyStats();

  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const firstName = String(user?.user_metadata?.full_name ?? 'Atleta').split(' ')[0];

  return (
    <Screen>
      <Text style={[styles.greeting, { color: theme.muted }]}>{greeting},</Text>
      <Text style={[styles.name, { color: theme.text }]}>{firstName}!</Text>

      {/* Estatísticas da semana */}
      <Card style={styles.statsCard}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Esta semana</Text>
        <View style={styles.statsRow}>
          <Stat
            label="Distância"
            value={formatDistance(stats?.totalDistanceMeters ?? 0)}
          />
          <Stat
            label="Tempo"
            value={formatDuration(stats?.totalDurationSeconds ?? 0)}
          />
          <Stat
            label="Corridas"
            value={String(stats?.runCount ?? 0)}
          />
        </View>
      </Card>

      {/* Player do Spotify */}
      <SpotifyPlayerCard />

      <Button
        title="Iniciar corrida"
        onPress={() => router.push('/run/active')}
        style={styles.startBtn}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting:  { fontSize: 20, fontWeight: '500', marginTop: spacing.sm },
  name:      { fontSize: 36, fontWeight: '900', marginBottom: spacing.lg },
  statsCard: { marginBottom: spacing.md },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm },
  statsRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  stat:      { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  startBtn:  { marginTop: spacing.lg },
});
