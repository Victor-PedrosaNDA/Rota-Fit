export interface RoutePoint {
  lat: number;
  lng: number;
  t: number; // timestamp em ms
}

export type RunStatus = 'idle' | 'active' | 'paused' | 'finished';

export interface Run {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number | null;
  route: RoutePoint[];
  spotifyTrackName: string | null;
  createdAt: string;
}

export interface SaveRunInput {
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  route: RoutePoint[];
  spotifyTrackName?: string | null;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp em ms
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  albumImageUrl: string | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}
