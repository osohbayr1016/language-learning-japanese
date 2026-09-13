import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen } from '../../primitives';
import { useGamification } from '../../context/GamificationContext';
import { MicrophoneTestPanel } from './MicrophoneTestPanel';
import { SettingsRoleRefreshCard } from './SettingsRoleRefreshCard';
import { ProfileScreenBackBar } from './ProfileScreenBackBar';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

const GOALS = [10, 30, 60, 120];

export function SettingsScreen() {
  const { dailyGoal, setDailyGoal } = useGamification();

  return (
    <Screen scroll>
      <ProfileScreenBackBar title={mn.profile.settings} fallback="/(tabs)/profile" style={{ marginBottom: spacing.lg }} />
      <Card padding="lg">
        <Text style={styles.section}>{mn.home.dailyGoal}</Text>
        <Text style={styles.hint}>Өдөрт хичнээн XP цуглуулах вэ?</Text>
        <View style={styles.row}>
          {GOALS.map((g) => {
            const active = g === dailyGoal;
            return (
              <Pressable
                key={g}
                onPress={() => void setDailyGoal(g)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {g} XP
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SettingsRoleRefreshCard />

      <Card padding="lg" style={{ marginTop: spacing.md }}>
        <Text style={styles.section}>{mn.profile.micTest}</Text>
        <MicrophoneTestPanel />
      </Card>

      <Card padding="lg" style={{ marginTop: spacing.md }}>
        <Text style={styles.section}>Дуудлага</Text>
        <View style={styles.tipRow}>
          <Ionicons name="hand-left-outline" size={20} color={colors.accent.purple} />
          <Text style={styles.tip}>{mn.pron.tap}</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={styles.tip}>{mn.pron.hold}</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="repeat-outline" size={20} color={colors.accent.teal} />
          <Text style={styles.tip}>{mn.pron.doubleTap}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.xs },
  hint: { ...typography.body.md, color: colors.text.secondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent.purple,
    borderColor: colors.accent.purple,
  },
  chipLabel: { ...typography.heading.sm, color: colors.text.secondary },
  chipLabelActive: { color: colors.text.inverse },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  tip: { ...typography.body.md, color: colors.text.secondary, flex: 1 },
});
