import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminSingleKanjiCreateCard } from '../../../src/features/admin/AdminSingleKanjiCreateCard';
import { colors, spacing } from '../../../src/theme';

export default function AdminNewWordScreen() {
  const [jlpt, setJlpt] = useState('1');
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <AdminSingleKanjiCreateCard
          jlpt={jlpt}
          onJlptChange={setJlpt}
          onCreated={(id) => {
            router.replace(`/admin/word/${id}`);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.primary },
  pad: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
});
