import { Platform } from 'react-native';

export const spotifyClientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
];

// Endpoints manuais (sem discovery document do Spotify)
export const spotifyDiscovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint:         'https://accounts.spotify.com/api/token',
};
