import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { Card } from '../Card';
import { useSpotify } from '@/context/SpotifyContext';
import {
  useNowPlaying,
  usePausePlayback,
  useResumePlayback,
  useSkipNext,
  useSkipPrevious,
} from '@/hooks/useSpotifyPlayer';
import { spacing, useTheme } from '@/theme';
import { SpotifyApiError } from '@/services/spotify';

function handleSpotifyError(e: unknown) {
  const msg =
    e instanceof SpotifyApiError ? e.message : 'Erro ao controlar o Spotify.';
  Alert.alert('Spotify', msg);
}

export function SpotifyPlayerCard() {
  const { theme } = useTheme();
  const { tokens, connect, connecting } = useSpotify();
  const { data: track } = useNowPlaying();
  const pause    = usePausePlayback();
  const resume   = useResumePlayback();
  const next     = useSkipNext();
  const previous = useSkipPrevious();

  // Sem conta conectada
  if (!tokens) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.hint, { color: theme.muted }]}>
          Conecte o Spotify para tocar músicas durante a corrida.
        </Text>
        <Button
          title={connecting ? 'Conectando…' : 'Conectar Spotify'}
          onPress={connect}
          disabled={connecting}
          variant="secondary"
        />
      </Card>
    );
  }

  // Nada tocando
  if (!track) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.hint, { color: theme.muted }]}>
          Abra o Spotify e toque uma música para ver o player aqui.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {track.albumImageUrl ? (
          <Image source={{ uri: track.albumImageUrl }} style={styles.art} />
        ) : (
          <View style={[styles.art, { backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="musical-notes" size={24} color={theme.primary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.trackName, { color: theme.text }]} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={[styles.artist, { color: theme.muted }]} numberOfLines={1}>
            {track.artists.join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Ionicons.Button
          name="play-skip-back"
          size={24}
          color={theme.text}
          backgroundColor="transparent"
          onPress={() => previous.mutate(undefined, { onError: handleSpotifyError })}
        />
        {track.isPlaying ? (
          <Ionicons.Button
            name="pause-circle"
            size={40}
            color={theme.primary}
            backgroundColor="transparent"
            onPress={() => pause.mutate(undefined, { onError: handleSpotifyError })}
          />
        ) : (
          <Ionicons.Button
            name="play-circle"
            size={40}
            color={theme.primary}
            backgroundColor="transparent"
            onPress={() => resume.mutate(undefined, { onError: handleSpotifyError })}
          />
        )}
        <Ionicons.Button
          name="play-skip-forward"
          size={24}
          color={theme.text}
          backgroundColor="transparent"
          onPress={() => next.mutate(undefined, { onError: handleSpotifyError })}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  art: { width: 52, height: 52, borderRadius: 8 },
  info: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '700' },
  artist:    { fontSize: 13 },
  controls:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
});
