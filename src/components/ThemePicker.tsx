import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassSurface } from './glass/GlassSurface';
import { radius, spacing, useTheme } from '@/theme';
import { ThemePreference } from '@/theme/ThemeContext';

const OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Claro',  value: 'light'  },
  { label: 'Escuro', value: 'dark'   },
  { label: 'Sistema', value: 'system' },
];

export function ThemePicker() {
  const { theme, preference, setPreference } = useTheme();

  return (
    <GlassSurface style={styles.container} intensity={20}>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = preference === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setPreference(opt.value)}
              style={[
                styles.option,
                active && { backgroundColor: theme.primary, borderRadius: radius.sm },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text
                style={[
                  styles.label,
                  { color: active ? theme.onPrimary : theme.muted },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.md },
  row: {
    flexDirection: 'row',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
});
