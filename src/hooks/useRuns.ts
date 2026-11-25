import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { deleteRun, getRun, getWeeklyStats, listRuns, saveRun } from '@/services/runs';
import { SaveRunInput } from '@/types';
import { averagePaceSecPerKm } from '@/utils/geo';

const RUNS_KEY    = ['runs'] as const;
const WEEKLY_KEY  = ['weekly-stats'] as const;

export function useRuns() {
  return useQuery({ queryKey: RUNS_KEY, queryFn: listRuns });
}

export function useRun(id: string) {
  return useQuery({ queryKey: [...RUNS_KEY, id], queryFn: () => getRun(id), enabled: !!id });
}

export function useWeeklyStats() {
  return useQuery({ queryKey: WEEKLY_KEY, queryFn: getWeeklyStats });
}

export function useSaveRun() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: SaveRunInput) => {
      if (!user) throw new Error('Usuário não autenticado.');
      return saveRun(input, user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RUNS_KEY });
      qc.invalidateQueries({ queryKey: WEEKLY_KEY });
    },
  });
}

export function useDeleteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRun,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RUNS_KEY });
      qc.invalidateQueries({ queryKey: WEEKLY_KEY });
    },
  });
}
