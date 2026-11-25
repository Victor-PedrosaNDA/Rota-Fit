import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { spacing, useTheme } from '@/theme';

export function LoadingView() {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      {onRetry && (
        <Button title="Tentar novamente" variant="secondary" onPress={onRetry} />
      )}
    </View>
  );
}

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'information-circle-outline', title, message }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={56} color={theme.muted} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title:   { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
