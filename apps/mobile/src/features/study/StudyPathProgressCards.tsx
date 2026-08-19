import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { useAuth } from '../../context/AuthContext';

export function StudyPathProgressCards() {
  const { user } = useAuth();
  // Using user's dashboard stats to calculate progress if available
  // Fallback to placeholder visual progress
  const lettersProgress = 0.45; // 45% Example
  const kanjiProgress = 0.12; // 12% Example

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent.blue + '20' }]}>
            <Text style={styles.iconChar}>あ</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Үсэг</Text>
            <Text style={styles.sub}>Хирагана · Катакана</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${lettersProgress * 100}%`, backgroundColor: colors.accent.blue }]} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accent.purple + '20' }]}>
            <Text style={styles.iconChar}>漢</Text>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Ханз</Text>
            <Text style={styles.sub}>Ханзны мэдлэг</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${kanjiProgress * 100}%`, backgroundColor: colors.accent.purple }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconChar: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.body.md,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sub: {
    ...typography.body.xs,
    color: colors.text.secondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
