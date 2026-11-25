import * as Location from 'expo-location';
import { useCallback, useReducer, useRef } from 'react';
import { SaveRunInput } from '@/types';
import { simplifyRoute } from '@/utils/geo';
import {
  elapsedSeconds,
  initialTrackerState,
  trackerReducer,
} from '@/utils/tracker';

export function useRunTracker() {
  const [state, dispatch] = useReducer(trackerReducer, initialTrackerState);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const watchLocation = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        dispatch({
          type: 'ADD_POINT',
          point: {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            t:   loc.timestamp,
          },
        });
      }
    );
  }, []);

  async function start() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error(
        'Permissão de localização negada. Vá em Ajustes → RotaFit → Localização e ative "Ao usar o app".'
      );
    }
    dispatch({ type: 'START', ts: Date.now() });
    await watchLocation();
  }

  function pause() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    dispatch({ type: 'PAUSE', ts: Date.now() });
  }

  async function resume() {
    dispatch({ type: 'RESUME', ts: Date.now() });
    await watchLocation();
  }

  function finish(): SaveRunInput {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    dispatch({ type: 'FINISH' });

    const now = Date.now();
    return {
      startedAt:        new Date(state.startedAt ?? now).toISOString(),
      endedAt:          new Date(now).toISOString(),
      distanceMeters:   state.distanceMeters,
      durationSeconds:  elapsedSeconds(state, now),
      route:            simplifyRoute(state.route),
    };
  }

  function reset() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    dispatch({ type: 'RESET' });
  }

  return { state, start, pause, resume, finish, reset, elapsedSeconds };
}
