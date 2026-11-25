import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { RoutePath } from '@/components/RoutePath';
import { useNowPlaying } from '@/hooks/useSpotifyPlayer';
import { useRunTracker } from '@/hooks/useRunTracker';
import { useSaveRun } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import { elapsedSeconds } from '@/utils/tracker';
import { formatDistance, formatDuration } from '@/utils/geo';
import { friendlyError } from '@/utils/errors';

export default function ActiveRunScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const tracker = useRunTracker();
  const saveRun = useSaveRun();
  const { data: nowPlaying } = useNowPlaying();

  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cronômetro: atualiza a cada segundo quando ativo
  useEffect(() => {
    if (tracker.state.status === 'active') {
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tracker.state.status]);

  async function handleStart() {
    try {
      setError(null);
      await tracker.start();
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  async function handleFinish() {
    if (tracker.state.distanceMeters < 10) {
      // Sem distância relevante — descarta silenciosamente
      tracker.reset();
      router.back();
      return;
    }

    Alert.alert('Finalizar corrida', 'Deseja salvar esta corrida?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar',
        onPress: async () => {
          try {
            const input = tracker.finish();
            // Inclui a faixa do Spotify, se houver
            if (nowPlaying?.name) {
              input.spotifyTrackName = `${nowPlaying.name} — ${nowPlaying.artists.join(', ')}`;
            }
            const saved = await saveRun.mutateAsync(input);
            router.replace(`/run/${saved.id}`);
          } catch (e) {
            Alert.alert('Erro ao salvar', friendlyError(e));
          }
        },
      },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Descartar corrida', 'Tem certeza? A corrida não será salva.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          tracker.reset();
          router.back();
        },
      },
    ]);
  }

  const elapsed = elapsedSeconds(tracker.state, Date.now());
  const isIdle    = tracker.state.status === 'idle';
  const isActive  = tracker.state.status === 'active';
  const isPaused  = tracker.state.status === 'paused';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Mapa da rota */}
      <View style={styles.mapContainer}>
        <RoutePath route={tracker.state.route} height={280} live={isActive} />
      </View>

      {/* Métricas */}
      <View style={styles.metrics}>
        <Text style={[styles.distance, { color: theme.text }]}>
          {formatDistance(tracker.state.distanceMeters)}
        </Text>
        <Text style={[styles.duration, { color: theme.muted }]}>
          {formatDuration(elapsed)}
        </Text>
      </View>

      {/* Faixa do Spotify */}
      {nowPlaying && (
        <Text style={[styles.track, { color: theme.primary }]} numberOfLines={1}>
          🎵 {nowPlaying.name} — {nowPlaying.artists[0]}
        </Text>
      )}

      {/* Erro */}
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}

      {/* Controles */}
      <View style={styles.controls}>
        {isIdle && (
          <Button title="Começar corrida" onPress={handleStart} style={styles.btn} />
        )}

        {isActive && (
          <>
            <Button title="Pausar"    variant="secondary" onPress={tracker.pause}  style={styles.btn} />
            <Button title="Finalizar" variant="primary"   onPress={handleFinish}   style={styles.btn} />
          </>
        )}

        {isPaused && (
          <>
            <Button title="Retomar"   variant="primary"   onPress={tracker.resume} style={styles.btn} />
            <Button title="Finalizar" variant="secondary"  onPress={handleFinish}  style={styles.btn} />
          </>
        )}

        {(isActive || isPaused) && (
          <Button title="Descartar" variant="ghost" onPress={handleDiscard} style={styles.btn} />
        )}
      </View>

      {saveRun.isPending && (
        <Text style={[styles.saving, { color: theme.muted }]}>Salvando…</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  metrics: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  distance: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  duration: {
    fontSize: 20,
    fontWeight: '500',
  },
  track: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  controls: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  btn: { width: '100%' },
  saving: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
