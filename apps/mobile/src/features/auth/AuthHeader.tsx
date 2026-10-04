import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { AuthLanguagePicker } from './AuthLanguagePicker';

type Props = {
  title: string;
  subtitle?: string;
};

export function AuthHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markText}>日</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Nihongo</Text>
            <Text style={styles.brandSub}>Монгол хэлээр япон хэл</Text>
          </View>
        </View>
        <AuthLanguagePicker />
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.brand.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  brandName: {
    ...typography.heading.md,
    color: colors.text.primary,
  },
  brandSub: {
    ...typography.body.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  title: {
    ...typography.heading.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body.lg,
    color: colors.text.secondary,
  },
});
