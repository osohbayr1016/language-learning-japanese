import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_LOCALE_DISPLAY, type AuthLocaleCode } from '../../i18n/authLocales';
import { colors, spacing, typography } from '../../theme';
import { useAuthLocale } from './AuthLocaleContext';

const ORDER: AuthLocaleCode[] = ['mn', 'ja', 'en'];

const webFocus =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'solid' as const,
        outlineWidth: 2,
        outlineColor: colors.brand.primary,
        outlineOffset: 2,
      } as const)
    : null;

export function AuthLanguagePicker() {
  const { locale, setLocale } = useAuthLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Олон хэл сонгох"
        accessibilityHint="Pick UI language"
        onPress={() => setOpen(true)}
        style={({ focused }) => [styles.trigger, focused && webFocus]}
      >
        <Ionicons name="globe-outline" size={22} color={colors.brand.secondary} />
        <Text style={styles.triggerText}>
          {AUTH_LOCALE_DISPLAY[locale]} <Text style={styles.chev}>▾</Text>
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Language / Хэл / 言語</Text>
            {ORDER.map((code) => {
              const active = locale === code;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={async () => {
                    await setLocale(code);
                    setOpen(false);
                  }}
                  style={({ focused }) => [styles.row, focused && webFocus]}
                >
                  <Text style={[styles.rowLabel, active && styles.rowLabelOn]}>
                    {AUTH_LOCALE_DISPLAY[code]}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.brand.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    alignSelf: 'flex-start',
  },
  triggerText: { ...typography.body.md, color: colors.text.primary, fontWeight: '700' },
  chev: { color: colors.text.muted, fontSize: 14 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.bg.primary,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    ...typography.body.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rowLabel: { ...typography.body.lg, color: colors.text.primary },
  rowLabelOn: { fontWeight: '700', color: colors.brand.primary },
});
