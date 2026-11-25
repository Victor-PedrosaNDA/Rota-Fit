import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function glassShadow(color: string) {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  });
}

export function GlassSurface({ children, style, intensity = 50 }: GlassSurfaceProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrapper, style, glassShadow(theme.primary)]}>
      <BlurView intensity={intensity} tint="default" style={StyleSheet.absoluteFill} />
      {/* Camada de cor sólida translúcida */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.surface },
        ]}
      />
      {/* Brilho superior (gradiente) */}
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.00)']}
        style={[StyleSheet.absoluteFill, styles.highlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Borda */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.border,
          { borderColor: theme.border },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  highlight: {
    height: '50%',
    top: 0,
  },
  border: {
    borderWidth: 1,
    borderRadius: 20,
  },
});
