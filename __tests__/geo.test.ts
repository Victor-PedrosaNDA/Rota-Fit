import {
  averagePaceSecPerKm,
  estimateCalories,
  formatDistance,
  formatDuration,
  formatPace,
  haversineMeters,
  isPlausibleJump,
  routeDistanceMeters,
  simplifyRoute,
} from '@/utils/geo';

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });

  it('approximates equatorial degree (~111 km)', () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('is symmetric', () => {
    const a = { lat: -23.5, lng: -46.6 };
    const b = { lat: -23.6, lng: -46.7 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 5);
  });
});

describe('isPlausibleJump', () => {
  const p0 = { lat: 0, lng: 0, t: 0 };

  it('accepts a slow movement', () => {
    // ~11m in 2 s → ~5.5 m/s — just under limit of 10
    const p1 = { lat: 0.0001, lng: 0, t: 2000 };
    expect(isPlausibleJump(p0, p1)).toBe(false);
  });

  it('rejects a teleport', () => {
    // 111km in 1s is implausible
    const p1 = { lat: 1, lng: 0, t: 1000 };
    expect(isPlausibleJump(p0, p1)).toBe(true);
  });

  it('rejects dt <= 0', () => {
    expect(isPlausibleJump(p0, { lat: 0, lng: 0, t: 0 })).toBe(true);
    expect(isPlausibleJump(p0, { lat: 0, lng: 0, t: -1 })).toBe(true);
  });
});

describe('routeDistanceMeters', () => {
  it('returns 0 for empty route', () => {
    expect(routeDistanceMeters([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(routeDistanceMeters([{ lat: 0, lng: 0, t: 0 }])).toBe(0);
  });

  it('accumulates segment distances', () => {
    const route = [
      { lat: 0, lng: 0, t: 0 },
      { lat: 0, lng: 0.001, t: 1000 },
      { lat: 0, lng: 0.002, t: 2000 },
    ];
    const d = routeDistanceMeters(route);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(300);
  });
});

describe('averagePaceSecPerKm', () => {
  it('returns null for zero distance', () => {
    expect(averagePaceSecPerKm(0, 300)).toBeNull();
  });

  it('calculates correctly', () => {
    // 1000m in 300s → 300 s/km
    expect(averagePaceSecPerKm(1000, 300)).toBe(300);
  });
});

describe('formatDistance', () => {
  it('formats meters when < 1000', () => {
    expect(formatDistance(500)).toBe('500 m');
  });

  it('formats km with 2 decimals', () => {
    expect(formatDistance(1500)).toBe('1.50 km');
  });
});

describe('formatDuration', () => {
  it('shows minutes and seconds when < 1h', () => {
    expect(formatDuration(90)).toBe('1min 30s');
  });

  it('shows hours and minutes when >= 1h', () => {
    expect(formatDuration(3660)).toBe('1h 1min');
  });
});

describe('formatPace', () => {
  it('shows pace in M\'SS" format', () => {
    expect(formatPace(305)).toBe("5'05\"");
  });

  it('returns — for null', () => {
    expect(formatPace(null)).toBe('—');
  });
});

describe('estimateCalories', () => {
  it('returns a positive number for positive inputs', () => {
    expect(estimateCalories(5000, 1800)).toBeGreaterThan(0);
  });
});

describe('simplifyRoute', () => {
  it('returns the original when points <= max', () => {
    const route = Array.from({ length: 5 }, (_, i) => ({ lat: i, lng: i, t: i }));
    expect(simplifyRoute(route, 10)).toHaveLength(5);
  });

  it('keeps first and last points', () => {
    const route = Array.from({ length: 300 }, (_, i) => ({ lat: i, lng: i, t: i }));
    const simplified = simplifyRoute(route, 50);
    expect(simplified[0]).toEqual(route[0]);
    expect(simplified[simplified.length - 1]).toEqual(route[route.length - 1]);
  });

  it('limits to max points', () => {
    const route = Array.from({ length: 500 }, (_, i) => ({ lat: i * 0.001, lng: i * 0.001, t: i * 1000 }));
    expect(simplifyRoute(route, 200).length).toBeLessThanOrEqual(200);
  });
});
