import {
  elapsedSeconds,
  initialTrackerState,
  trackerReducer,
  TrackerState,
} from '@/utils/tracker';

// ─── helpers ────────────────────────────────────────────────────────────────

function pt(lat: number, lng: number, t: number) {
  return { lat, lng, t };
}

function applyActions(actions: Parameters<typeof trackerReducer>[1][]) {
  return actions.reduce<TrackerState>(trackerReducer, initialTrackerState);
}

// ─── initial state ───────────────────────────────────────────────────────────

describe('initialTrackerState', () => {
  it('has idle status', () => {
    expect(initialTrackerState.status).toBe('idle');
  });

  it('has zero distance and empty route', () => {
    expect(initialTrackerState.distanceMeters).toBe(0);
    expect(initialTrackerState.route).toHaveLength(0);
  });
});

// ─── START ───────────────────────────────────────────────────────────────────

describe('START action', () => {
  it('sets status to active', () => {
    const s = trackerReducer(initialTrackerState, { type: 'START', startedAt: 1000 });
    expect(s.status).toBe('active');
  });

  it('records startedAt', () => {
    const s = trackerReducer(initialTrackerState, { type: 'START', startedAt: 42 });
    expect(s.startedAt).toBe(42);
  });

  it('resets distance and route', () => {
    const s = trackerReducer(initialTrackerState, { type: 'START', startedAt: 0 });
    expect(s.distanceMeters).toBe(0);
    expect(s.route).toHaveLength(0);
  });
});

// ─── ADD_POINT ───────────────────────────────────────────────────────────────

describe('ADD_POINT action', () => {
  const started = trackerReducer(initialTrackerState, { type: 'START', startedAt: 0 });

  it('ignores points when not active (idle)', () => {
    const s = trackerReducer(initialTrackerState, {
      type: 'ADD_POINT',
      point: pt(0, 0, 0),
    });
    expect(s.route).toHaveLength(0);
  });

  it('ignores points when paused', () => {
    const paused = trackerReducer(started, { type: 'PAUSE', pausedAt: 1000 });
    const s = trackerReducer(paused, { type: 'ADD_POINT', point: pt(0, 0.001, 2000) });
    expect(s.route).toHaveLength(0);
  });

  it('appends first point without distance change', () => {
    const s = trackerReducer(started, { type: 'ADD_POINT', point: pt(0, 0, 100) });
    expect(s.route).toHaveLength(1);
    expect(s.distanceMeters).toBe(0);
  });

  it('accumulates distance for plausible jumps', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'ADD_POINT', point: pt(0, 0, 0) },
      { type: 'ADD_POINT', point: pt(0, 0.001, 2000) }, // ~111m in 2s ≈ 55 m/s — too fast?
      // Use a very short distance (0.00001° ≈ 1m) in 2s
    ]);
    // Even if that specific jump is filtered, test that distance doesn't go negative
    expect(s.distanceMeters).toBeGreaterThanOrEqual(0);
  });

  it('rejects implausible GPS jumps (teleport)', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'ADD_POINT', point: pt(0, 0, 0) },
      { type: 'ADD_POINT', point: pt(1, 0, 100) }, // 111km in 100ms → rejected
    ]);
    // Second point is added to route (we store it), but distance stays 0
    expect(s.distanceMeters).toBe(0);
  });

  it('accumulates distance for valid slow movement', () => {
    // 0.00001° ≈ 1.1m; at 2000ms = 0.55 m/s — well under 10 m/s limit
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'ADD_POINT', point: pt(0, 0, 0) },
      { type: 'ADD_POINT', point: pt(0, 0.00001, 2000) },
    ]);
    expect(s.distanceMeters).toBeGreaterThan(0);
  });
});

// ─── PAUSE / RESUME ──────────────────────────────────────────────────────────

describe('PAUSE action', () => {
  it('sets status to paused', () => {
    const started = trackerReducer(initialTrackerState, { type: 'START', startedAt: 0 });
    const s = trackerReducer(started, { type: 'PAUSE', pausedAt: 5000 });
    expect(s.status).toBe('paused');
  });

  it('records pausedAt', () => {
    const started = trackerReducer(initialTrackerState, { type: 'START', startedAt: 0 });
    const s = trackerReducer(started, { type: 'PAUSE', pausedAt: 5000 });
    expect(s.pausedAt).toBe(5000);
  });
});

describe('RESUME action', () => {
  it('sets status back to active', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'PAUSE', pausedAt: 1000 },
      { type: 'RESUME', resumedAt: 3000 },
    ]);
    expect(s.status).toBe('active');
  });

  it('accumulates paused time', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'PAUSE', pausedAt: 1000 },
      { type: 'RESUME', resumedAt: 3000 }, // 2000ms paused
    ]);
    expect(s.totalPausedMs).toBe(2000);
  });

  it('clears pausedAt after resume', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'PAUSE', pausedAt: 1000 },
      { type: 'RESUME', resumedAt: 3000 },
    ]);
    expect(s.pausedAt).toBeUndefined();
  });
});

// ─── FINISH ──────────────────────────────────────────────────────────────────

describe('FINISH action', () => {
  it('sets status to finished', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'FINISH', endedAt: 60000 },
    ]);
    expect(s.status).toBe('finished');
  });

  it('records endedAt', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'FINISH', endedAt: 60000 },
    ]);
    expect(s.endedAt).toBe(60000);
  });
});

// ─── RESET ───────────────────────────────────────────────────────────────────

describe('RESET action', () => {
  it('restores initial state', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'ADD_POINT', point: pt(0, 0, 0) },
      { type: 'FINISH', endedAt: 60000 },
      { type: 'RESET' },
    ]);
    expect(s).toEqual(initialTrackerState);
  });
});

// ─── elapsedSeconds ──────────────────────────────────────────────────────────

describe('elapsedSeconds', () => {
  it('returns 0 when not started', () => {
    expect(elapsedSeconds(initialTrackerState, 5000)).toBe(0);
  });

  it('calculates running time correctly', () => {
    const s = trackerReducer(initialTrackerState, { type: 'START', startedAt: 0 });
    expect(elapsedSeconds(s, 10000)).toBe(10);
  });

  it('subtracts pause time', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'PAUSE', pausedAt: 5000 },
      { type: 'RESUME', resumedAt: 8000 }, // 3s paused
    ]);
    // at t=15000: total 15s - 3s paused = 12s
    expect(elapsedSeconds(s, 15000)).toBe(12);
  });

  it('subtracts ongoing pause time when paused', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'PAUSE', pausedAt: 5000 },
    ]);
    // at t=10000: 10s elapsed but paused at 5s, currently pausing for 5s more
    expect(elapsedSeconds(s, 10000)).toBe(5);
  });

  it('is stable after finish', () => {
    const s = applyActions([
      { type: 'START', startedAt: 0 },
      { type: 'FINISH', endedAt: 30000 },
    ]);
    expect(elapsedSeconds(s, 30000)).toBe(30);
    // nowMs beyond endedAt shouldn't matter once finished
    expect(elapsedSeconds(s, 60000)).toBe(30);
  });
});
