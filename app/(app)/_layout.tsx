import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    />
  );
}
