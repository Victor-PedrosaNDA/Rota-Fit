import React from 'react';
import { ViewStyle } from 'react-native';
import { GlassSurface } from './glass/GlassSurface';
import { radius, spacing } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function Card({ children, style, intensity = 30 }: CardProps) {
  return (
    <GlassSurface
      intensity={intensity}
      style={[
        {
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </GlassSurface>
  );
}
