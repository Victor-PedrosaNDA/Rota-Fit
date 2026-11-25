import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';
import { RoutePoint } from '@/types';

interface RoutePathProps {
  route: RoutePoint[];
  height?: number;
  live?: boolean; // mostra o marcador pulsante na última posição
}

function normalize(
  points: RoutePoint[],
  width: number,
  height: number,
  padding = 20
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const dLat = maxLat - minLat || 0.0001;
  const dLng = maxLng - minLng || 0.0001;

  return points.map((p) => ({
    x: padding + ((p.lng - minLng) / dLng) * (width - padding * 2),
    y: height - padding - ((p.lat - minLat) / dLat) * (height - padding * 2),
  }));
}

/** Converte pontos em path SVG com curvas Catmull-Rom → Bézier cúbico */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function RoutePath({ route, height = 200, live = false }: RoutePathProps) {
  const { theme } = useTheme();
  const width = 320; // viewport fixo — escalado pelo SVG
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [live]);

  if (route.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Grade de pontos */}
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 12 }).map((_, col) => (
              <Circle
                key={`${row}-${col}`}
                cx={col * (width / 11) + 10}
                cy={row * (height / 7) + 10}
                r={1.5}
                fill={theme.muted}
                opacity={0.3}
              />
            ))
          )}
        </Svg>
      </View>
    );
  }

  const pts = normalize(route, width, height);
  const pathD = smoothPath(pts);
  const start = pts[0];
  const end   = pts[pts.length - 1];

  return (
    <View style={{ height }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor="#22C55E" />
            <Stop offset="1"   stopColor="#EF4444" />
          </LinearGradient>
        </Defs>

        {/* Traçado */}
        <Path
          d={pathD}
          stroke="url(#routeGrad)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Círculo de início */}
        <Circle cx={start.x} cy={start.y} r={6} fill="#22C55E" />

        {/* Círculo de fim / posição atual */}
        <Circle cx={end.x} cy={end.y} r={6} fill={live ? theme.primary : '#EF4444'} />

        {/* Pulsação quando ao vivo */}
        {live && (
          <Circle
            cx={end.x}
            cy={end.y}
            r={12}
            fill={theme.primary}
            opacity={0.3}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { overflow: 'hidden' },
});
