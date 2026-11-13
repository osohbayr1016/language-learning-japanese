import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AdminBulkKanjiPaste } from '../../src/features/admin/AdminBulkKanjiPaste';
import { AdminSingleKanjiCreateCard } from '../../src/features/admin/AdminSingleKanjiCreateCard';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/theme';

export default function AdminWordsScreen() {
  const { token } = useAuth();
  const [jlpt, setJlpt] = useState('1');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <AdminSingleKanjiCreateCard jlpt={jlpt} onJlptChange={setJlpt} />
        <AdminBulkKanjiPaste token={token} jlptLevel={jlpt} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.primary },
  pad: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
});
