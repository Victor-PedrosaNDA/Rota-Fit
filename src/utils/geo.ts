import { RoutePoint } from '@/types';

const R = 6371000; // raio da Terra em metros
const MAX_SPEED_MPS = 10; // ~36 km/h — limite para filtrar saltos de GPS

/** Distância em metros entre dois pontos via fórmula de Haversine */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Retorna false se o salto implica velocidade maior que MAX_SPEED_MPS */
export function isPlausibleJump(a: RoutePoint, b: RoutePoint): boolean {
  const dtSeconds = (b.t - a.t) / 1000;
  if (dtSeconds <= 0) return false;
  const dist = haversineMeters(a.lat, a.lng, b.lat, b.lng);
  return dist / dtSeconds <= MAX_SPEED_MPS;
}

/** Distância total acumulada de uma rota */
export function routeDistanceMeters(route: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += haversineMeters(
      route[i - 1].lat, route[i - 1].lng,
      route[i].lat,     route[i].lng
    );
  }
  return total;
}

/** Ritmo médio em segundos por km */
export function averagePaceSecPerKm(
  distanceMeters: number,
  durationSeconds: number
): number {
  if (distanceMeters <= 0) return 0;
  return (durationSeconds / distanceMeters) * 1000;
}

/** Formata distância: "5,20 km" ou "420 m" */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} km`;
  }
  return `${Math.round(meters)} m`;
}

/** Formata duração em "1h 23min" ou "23min 45s" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  if (m > 0) return `${m}min ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/** Formata ritmo em "5'30\"" (min/km) */
export function formatPace(secPerKm: number | null): string {
  if (!secPerKm || secPerKm <= 0) return '--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${sec.toString().padStart(2, '0')}"`;
}

/** Estimativa simples de calorias (MET 8 × peso padrão 70 kg) */
export function estimateCalories(distanceMeters: number, durationSeconds: number): number {
  const MET = 8;
  const weightKg = 70;
  const hours = durationSeconds / 3600;
  return Math.round(MET * weightKg * hours);
}

/**
 * Simplifica a rota para no máximo maxPoints pontos por amostragem uniforme.
 * Mantém sempre o primeiro e o último ponto.
 */
export function simplifyRoute(route: RoutePoint[], maxPoints = 200): RoutePoint[] {
  if (route.length <= maxPoints) return route;
  const result: RoutePoint[] = [route[0]];
  const step = (route.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(route[Math.round(i * step)]);
  }
  result.push(route[route.length - 1]);
  return result;
}
