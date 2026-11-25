import { SpotifyTrack } from '@/types';

const BASE = 'https://api.spotify.com/v1';

export class SpotifyApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

async function call<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 204 || res.status === 202) return null;

  if (res.status === 404) {
    throw new SpotifyApiError(404, 'Abra o Spotify e toque uma música antes de usar os controles.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new SpotifyApiError(res.status, body?.error?.message ?? `Erro ${res.status}`);
  }

  return res.json() as Promise<T>;
}

interface SpotifyCurrentlyPlayingResponse {
  item: {
    id: string;
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: { name: string; images: Array<{ url: string }> };
  } | null;
  is_playing: boolean;
  progress_ms: number;
}

export async function getNowPlaying(token: string): Promise<SpotifyTrack | null> {
  const data = await call<SpotifyCurrentlyPlayingResponse>(
    token,
    '/me/player/currently-playing'
  );
  if (!data?.item) return null;

  return {
    id:            data.item.id,
    name:          data.item.name,
    artists:       data.item.artists.map((a) => a.name),
    albumName:     data.item.album.name,
    albumImageUrl: data.item.album.images[0]?.url ?? null,
    isPlaying:     data.is_playing,
    progressMs:    data.progress_ms,
    durationMs:    data.item.duration_ms,
  };
}

export async function pausePlayback(token: string): Promise<void> {
  await call(token, '/me/player/pause', { method: 'PUT' });
}

export async function resumePlayback(token: string): Promise<void> {
  await call(token, '/me/player/play', { method: 'PUT' });
}

export async function skipNext(token: string): Promise<void> {
  await call(token, '/me/player/next', { method: 'POST' });
}

export async function skipPrevious(token: string): Promise<void> {
  await call(token, '/me/player/previous', { method: 'POST' });
}
