import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { GoogleIcon } from '@/components/GoogleIcon';
import { signInWithGoogle } from '@/lib/googleAuth';
import { spacing, useTheme } from '@/theme';
import { friendlyError } from '@/utils/errors';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>RotaFit</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Registre suas corridas, ouça músicas e acompanhe sua evolução.
        </Text>
      </View>

      <View style={styles.footer}>
        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}

        <Button
          title={loading ? 'Entrando…' : 'Continuar com Google'}
          onPress={handleLogin}
          loading={loading}
          variant="dark"
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing.sm,
  },
});
