import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ThemePicker } from '@/components/ThemePicker';
import { useAuth } from '@/context/AuthContext';
import { spacing, useTheme } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const name = (user?.user_metadata?.full_name as string | undefined) ?? 'Usuário';
  const email = user?.email ?? '';
  const avatarLetter = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <Screen scroll edges={['bottom', 'left', 'right']}>
      {/* Avatar + name */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarLetter, { color: theme.onPrimary }]}>
            {avatarLetter}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.email, { color: theme.muted }]}>{email}</Text>
      </View>

      {/* Theme picker */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>APARÊNCIA</Text>
        <ThemePicker />
      </Card>

      {/* Sign out */}
      <Button
        title="Sair da conta"
        variant="ghost"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLetter: { fontSize: 32, fontWeight: '800' },
  name:  { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14 },
  card:  { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  signOut: { marginTop: spacing.sm },
});
