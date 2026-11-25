import { RoutePoint, RunStatus } from '@/types';
import { haversineMeters, isPlausibleJump } from './geo';

export interface TrackerState {
  status: RunStatus;
  startedAt: number | null;      // timestamp ms
  pausedAt: number | null;       // timestamp ms (início da pausa atual)
  totalPausedMs: number;         // ms acumulados em pausa
  distanceMeters: number;
  route: RoutePoint[];
  lastPoint: RoutePoint | null;
}

export type TrackerAction =
  | { type: 'START'; ts: number }
  | { type: 'ADD_POINT'; point: RoutePoint }
  | { type: 'PAUSE'; ts: number }
  | { type: 'RESUME'; ts: number }
  | { type: 'FINISH' }
  | { type: 'RESET' };

export const initialTrackerState: TrackerState = {
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  distanceMeters: 0,
  route: [],
  lastPoint: null,
};

export function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  switch (action.type) {
    case 'START':
      if (state.status !== 'idle') return state;
      return {
        ...initialTrackerState,
        status: 'active',
        startedAt: action.ts,
      };

    case 'ADD_POINT': {
      if (state.status !== 'active') return state;
      const { point } = action;

      // Rejeita salto implausível (erro de GPS)
      if (state.lastPoint && !isPlausibleJump(state.lastPoint, point)) {
        return state;
      }

      const added = state.lastPoint
        ? haversineMeters(state.lastPoint.lat, state.lastPoint.lng, point.lat, point.lng)
        : 0;

      return {
        ...state,
        distanceMeters: state.distanceMeters + added,
        route: [...state.route, point],
        lastPoint: point,
      };
    }

    case 'PAUSE':
      if (state.status !== 'active') return state;
      return { ...state, status: 'paused', pausedAt: action.ts };

    case 'RESUME':
      if (state.status !== 'paused' || state.pausedAt === null) return state;
      return {
        ...state,
        status: 'active',
        totalPausedMs: state.totalPausedMs + (action.ts - state.pausedAt),
        pausedAt: null,
      };

    case 'FINISH':
      if (state.status !== 'active' && state.status !== 'paused') return state;
      return { ...state, status: 'finished' };

    case 'RESET':
      return { ...initialTrackerState };

    default:
      return state;
  }
}

/** Retorna os segundos efetivos de corrida (exclui pausas) */
export function elapsedSeconds(state: TrackerState, nowMs: number): number {
  if (!state.startedAt) return 0;
  const totalMs = nowMs - state.startedAt;
  const pausedMs =
    state.totalPausedMs +
    (state.status === 'paused' && state.pausedAt ? nowMs - state.pausedAt : 0);
  return Math.max(0, Math.floor((totalMs - pausedMs) / 1000));
}
