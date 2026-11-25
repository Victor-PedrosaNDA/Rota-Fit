import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { glassShadow } from './glass/GlassSurface';
import { radius, spacing, useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const bg: Record<Variant, string> = {
    primary:   theme.primary,
    secondary: 'transparent',
    danger:    theme.danger,
    ghost:     'transparent',
    dark:      'rgba(0,0,0,0.70)',
  };

  const opacity: Record<Variant, number> = {
    primary:   0.94,
    secondary: 0.60,
    danger:    0.94,
    ghost:     0.12,
    dark:      0.94,
  };

  const textColor: Record<Variant, string> = {
    primary:   theme.onPrimary,
    secondary: theme.primary,
    danger:    '#FFFFFF',
    ghost:     theme.primary,
    dark:      '#FFFFFF',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg[variant],
          opacity: pressed || disabled ? 0.5 : opacity[variant],
          ...glassShadow(theme.primary),
        },
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
