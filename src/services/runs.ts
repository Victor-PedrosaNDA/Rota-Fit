import { supabase } from '@/lib/supabase';
import { Run, SaveRunInput } from '@/types';
import { averagePaceSecPerKm } from '@/utils/geo';

function toRun(row: Record<string, unknown>): Run {
  return {
    id:               row.id as string,
    userId:           row.user_id as string,
    startedAt:        row.started_at as string,
    endedAt:          row.ended_at as string,
    distanceMeters:   Number(row.distance_meters),
    durationSeconds:  Number(row.duration_seconds),
    avgPaceSecPerKm:  row.avg_pace_sec_per_km != null ? Number(row.avg_pace_sec_per_km) : null,
    route:            (row.route as Run['route']) ?? [],
    spotifyTrackName: (row.spotify_track_name as string) ?? null,
    createdAt:        row.created_at as string,
  };
}

export async function listRuns(): Promise<Run[]> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toRun);
}

export async function getRun(id: string): Promise<Run> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return toRun(data);
}

export async function saveRun(
  input: SaveRunInput,
  userId: string
): Promise<Run> {
  const avgPace = averagePaceSecPerKm(input.distanceMeters, input.durationSeconds);

  const { data, error } = await supabase
    .from('runs')
    .insert({
      user_id:            userId,
      started_at:         input.startedAt,
      ended_at:           input.endedAt,
      distance_meters:    input.distanceMeters,
      duration_seconds:   input.durationSeconds,
      avg_pace_sec_per_km: avgPace > 0 ? avgPace : null,
      route:              input.route,
      spotify_track_name: input.spotifyTrackName ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toRun(data);
}

export async function deleteRun(id: string): Promise<void> {
  const { error } = await supabase.from('runs').delete().eq('id', id);
  if (error) throw error;
}

export interface WeeklyStats {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  runCount: number;
}

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const { data, error } = await supabase.rpc('weekly_stats');
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    totalDistanceMeters:  Number(row?.total_distance_meters ?? 0),
    totalDurationSeconds: Number(row?.total_duration_seconds ?? 0),
    runCount:             Number(row?.run_count ?? 0),
  };
}
