import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSpotify } from '@/context/SpotifyContext';
import {
  getNowPlaying,
  pausePlayback,
  resumePlayback,
  skipNext,
  skipPrevious,
} from '@/services/spotify';

const NOW_PLAYING_KEY = ['spotify', 'now-playing'] as const;
const INVALIDATE_DELAY_MS = 400;

export function useNowPlaying() {
  const { getValidAccessToken, tokens } = useSpotify();

  return useQuery({
    queryKey: NOW_PLAYING_KEY,
    queryFn: async () => {
      const token = await getValidAccessToken();
      if (!token) return null;
      return getNowPlaying(token);
    },
    enabled: !!tokens,
    refetchInterval: 5000,
  });
}

function useControl(fn: (token: string) => Promise<void>) {
  const { getValidAccessToken } = useSpotify();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getValidAccessToken();
      if (!token) throw new Error('Sem token Spotify válido');
      return fn(token);
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: NOW_PLAYING_KEY });
      }, INVALIDATE_DELAY_MS);
    },
  });
}

export const usePausePlayback   = () => useControl(pausePlayback);
export const useResumePlayback  = () => useControl(resumePlayback);
export const useSkipNext        = () => useControl(skipNext);
export const useSkipPrevious    = () => useControl(skipPrevious);
