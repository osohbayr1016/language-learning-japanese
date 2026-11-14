import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../primitives";
import { useAuth } from "../../context/AuthContext";
import { useGamification } from "../../context/GamificationContext";
import { api } from "../../lib/api";
import { rewardOutbox } from "../../lib/rewardOutboxStorage";
import { rewardAccountFromToken } from "../../lib/rewardOutbox";
import { colors, radius, spacing, typography } from "../../theme";

/** Shared recovery entrypoint for unsent study and game sessions after app restart. */
export function PendingRewardsCard() {
  const { token } = useAuth();
  const { refresh } = useGamification();
  const owner = rewardAccountFromToken(token);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!owner) { setCount(0); setError(""); return; }
    try {
      const rows = await rewardOutbox.list(owner);
      setCount(rows.length);
    } catch {
      setError("Дутуу хадгалсан дасгалуудыг уншиж чадсангүй.");
    }
  }, [owner]);

  useEffect(() => { void load(); }, [load]);
  const retry = async () => {
    if (!owner || !token || busy) return;
    setBusy(true);
    setError("");
    try {
      const rows = await rewardOutbox.list(owner);
      for (const row of rows) {
        // Idempotent API responses include already_saved for uncertain retries.
        if (row.kind === "study") await api.user.saveProgress(token, row.body);
        else await api.games.saveSession(token, row.body);
        await rewardOutbox.remove(owner, row.kind, row.session_id);
      }
      await refresh();
    } catch {
      setError("Сервертэй холбогдож чадсангүй. Үр дүн төхөөрөмж дээр хэвээр байна.");
    } finally {
      await load();
      setBusy(false);
    }
  };

  if (!owner || (!count && !error)) return null;
  return (
    <View style={{
      padding: spacing.md, backgroundColor: colors.bg.card,
      borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg,
      marginBottom: spacing.md, gap: spacing.sm,
    }}>
      <Text style={{ ...typography.heading.sm, color: colors.text.primary }}>
        Хадгалагдаагүй дасгал: {count}
      </Text>
      <Text style={{ ...typography.body.sm, color: colors.text.secondary }}>
        Дасгалын үр дүн энэ төхөөрөмж дээр хадгалагдсан. Давхар XP авахгүйгээр илгээх боломжтой.
      </Text>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
      <Button label="ҮР ДҮН ИЛГЭЭХ" loading={busy} disabled={busy || count === 0} onPress={() => { void retry(); }} />
    </View>
  );
}
