import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import type { Cartoon } from '../../lib/api/cartoons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { CartoonAdminAttachModal } from './CartoonAdminAttachModal';
import { CartoonAdminCreateSection } from './CartoonAdminCreateSection';

export function AdminCartoonsScreen() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Cartoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [attachId, setAttachId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.cartoons.list({});
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрсэн байх шаардлагатай.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CartoonAdminCreateSection
        token={token}
        busy={busy}
        setBusy={setBusy}
        onCreated={(id) => {
          setAttachId(id);
          void load();
        }}
      />
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(c) => String(c.id)}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={<Text style={styles.sub}>Нийтлэгдсэн жагсаалт</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setAttachId(item.id)}>
            <Text style={styles.rowTitle}>{item.title_mn}</Text>
            <Text style={styles.meta}>
              #{item.id} · JLPT {item.jlpt_level ? 'N'+(6-item.jlpt_level) : '—'} · {item.duration_s}s
            </Text>
            <Text style={styles.link}>Үг холбох →</Text>
          </Pressable>
        )}
      />
      <CartoonAdminAttachModal
        token={token}
        cartoonId={attachId}
        visible={attachId !== null}
        onClose={() => setAttachId(null)}
        onSaved={() => void load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  muted: { ...typography.body.md, color: colors.text.muted, textAlign: 'center' },
  listPad: { paddingBottom: spacing.xxl },
  sub: {
    ...typography.body.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { ...typography.body.md, color: colors.text.primary, fontWeight: '600' },
  meta: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  link: { ...typography.body.sm, color: colors.brand.primary, marginTop: 4, fontWeight: '700' },
});
