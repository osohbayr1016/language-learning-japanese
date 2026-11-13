import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { colors, spacing } from '../../theme';
import { adminVocabularyStyles as styles } from './AdminVocabularyStyles';
import { useAdminVocabularyList } from './useAdminVocabularyList';
import { jlptNLabel } from '../../lib/jlptLabel';

const JLPT_OPTS = [1, 2, 3, 4, 5] as const;

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

export function AdminVocabularyScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const a = mn.admin;
  const {
    q,
    setQ,
    jlpt,
    setJlpt,
    singleOnly,
    setSingleOnly,
    rows,
    loading,
    loadingMore,
    hasMore,
    total,
    loadMore,
  } = useAdminVocabularyList();

  return (
    <View style={styles.flex}>
      <View style={styles.filtersHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowIn}
          keyboardShouldPersistTaps="handled"
        >
          <Chip active={jlpt === undefined} label={a.vocabFilterAll} onPress={() => setJlpt(undefined)} />
          {JLPT_OPTS.map((lvl) => (
            <Chip key={lvl} active={jlpt === lvl} label={jlptNLabel(lvl)} onPress={() => setJlpt(lvl)} />
          ))}
        </ScrollView>
        <Pressable
          style={[styles.toggleRow, singleOnly && styles.toggleRowOn]}
          onPress={() => setSingleOnly((v) => !v)}
        >
          <Text style={styles.toggleTxt}>{a.vocabSingleCharOnly}</Text>
        </Pressable>
      </View>
      <View style={styles.bar}>
        <TextInput
          style={styles.inp}
          placeholder={a.vocabSearchPlaceholder}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
      </View>
      <Text style={styles.metaBar}>{total ? `${rows.length}/${total}` : rows.length}</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.brand.primary} />
      ) : (
        <FlatList
          style={styles.listFill}
          data={rows}
          keyExtractor={(w) => String(w.id)}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <Text style={styles.footer}>{a.vocabLoadingMore}</Text>
            ) : !hasMore && rows.length ? (
              <Text style={styles.footer}>{a.vocabEndOfList}</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/admin/word/${item.id}`)}>
              <Text style={styles.hz}>{item.kanji}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {jlptNLabel(item.jlpt_level)} · {item.romaji} · {item.meaning_mn}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
