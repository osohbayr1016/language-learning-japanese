import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { colors, radius, spacing, tint, typography } from '../../theme';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { AuthFooter } from './AuthFooter';
import { useAuthLocale } from './AuthLocaleContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { strings } = useAuthLocale();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showRedirectBanner = useMemo(() => reason === 'protected', [reason]);

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login({ email, password });
      await signIn(res.data);
    } catch (err) {
      setError((err as Error).message || strings.requestFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {showRedirectBanner ? (
          <View style={styles.banner} accessibilityRole="alert">
            <Text style={styles.bannerText}>{strings.redirectLoginRequired}</Text>
          </View>
        ) : null}
        <AuthHeader title={strings.loginTitle} subtitle={strings.loginSubtitle} />
        <AuthForm mode="login" loading={loading} error={error} onSubmit={handleSubmit} />
        <AuthFooter mode="login" />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: tint(colors.info, 0.1),
    borderWidth: 1,
    borderColor: tint(colors.info, 0.35),
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bannerText: { ...typography.body.md, color: colors.text.primary, fontWeight: '600', flex: 1 },
});
