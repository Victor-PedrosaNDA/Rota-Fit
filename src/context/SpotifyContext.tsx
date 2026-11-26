import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStore';
import { spotifyClientId, spotifyDiscovery, SPOTIFY_SCOPES } from '@/lib/spotify';
import { SpotifyTokens } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const TOKENS_KEY = 'rotafit.spotify.tokens';
const REFRESH_BUFFER_MS = 60_000; // renova 60s antes de expirar

interface SpotifyContextValue {
  tokens: SpotifyTokens | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [connecting, setConnecting] = useState(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'rotafit', path: 'spotify-callback' });
console.log('Spotify redirectUri:', redirectUri);

  // Carrega tokens do SecureStore na inicialização
  useEffect(() => {
    getSecureItem(TOKENS_KEY).then((raw) => {
      if (raw) {
        try {
          setTokens(JSON.parse(raw));
        } catch {
          // tokens corrompidos — ignora
        }
      }
    });
  }, []);

  async function saveTokens(t: SpotifyTokens) {
    setTokens(t);
    await setSecureItem(TOKENS_KEY, JSON.stringify(t));
  }

  async function connect() {
    setConnecting(true);
    try {
      const verifier = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36)
      );
      const challenge = verifier; // simplificado — em produção use PKCE real

      const request = new AuthSession.AuthRequest({
        clientId: spotifyClientId,
        scopes: SPOTIFY_SCOPES,
        redirectUri,
        usePKCE: true,
      });

      const result = await request.promptAsync(spotifyDiscovery);
      if (result.type !== 'success') return;

      // Troca o código por tokens
      const tokenRes = await fetch(spotifyDiscovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          code:           result.params.code,
          redirect_uri:   redirectUri,
          client_id:      spotifyClientId,
          code_verifier:  request.codeVerifier ?? '',
        }).toString(),
      });

      const data = await tokenRes.json();
      if (!data.access_token) throw new Error('Sem token na resposta do Spotify');

      await saveTokens({
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        expiresAt:    Date.now() + data.expires_in * 1000,
      });
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    setTokens(null);
    await deleteSecureItem(TOKENS_KEY);
  }

  const refresh = useCallback(async (): Promise<string | null> => {
    if (!tokens?.refreshToken) return null;

    const res = await fetch(spotifyDiscovery.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token:  tokens.refreshToken,
        client_id:      spotifyClientId,
      }).toString(),
    });

    const data = await res.json();
    if (!data.access_token) return null;

    const updated: SpotifyTokens = {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      expiresAt:    Date.now() + data.expires_in * 1000,
    };
    await saveTokens(updated);
    return updated.accessToken;
  }, [tokens]);

  /** Retorna um access token válido, renovando automaticamente se necessário */
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;

    if (Date.now() < tokens.expiresAt - REFRESH_BUFFER_MS) {
      return tokens.accessToken;
    }

    // Deduplica renovações simultâneas
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refresh().finally(() => {
        refreshPromiseRef.current = null;
      });
    }
    return refreshPromiseRef.current;
  }, [tokens, refresh]);

  return (
    <SpotifyContext.Provider value={{ tokens, connecting, connect, disconnect, getValidAccessToken }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify must be used inside SpotifyProvider');
  return ctx;
}
