import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Dialog } from '../../primitives';
import { api } from '../../lib/api';
import type { DynamicStory } from '../../lib/api/reading';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { useLearnedWords } from '../../hooks/useLearnedWords';
import { addLearnedWords } from '../../lib/learnedWordsStorage';

export function DynamicReadingScreen() {
  const router = useRouter();
  const { words: knownWords, loading: knownWordsLoading } = useLearnedWords();
  const [story, setStory] = useState<DynamicStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [savingWords, setSavingWords] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  const [selectedToken, setSelectedToken] = useState<{ text: string; romaji: string; meaning_mn: string } | null>(null);

  useEffect(() => {
    if (knownWordsLoading) return;
    let cancelled = false;
    async function generate() {
      setLoading(true);
      setError(null);
      try {
        const validKana = /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー々〆ヶ・]+$/u;
        const wordList = knownWords.map(w => w.kana).filter(w => validKana.test(w)).slice(0, 60);
        const res = await api.reading.generate(wordList.length ? wordList : ['こんにちは', 'さようなら', 'はい', 'いいえ']);
        if (!cancelled) setStory(res);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void generate();
    return () => { cancelled = true; };
  }, [knownWords, knownWordsLoading]);

  const handleFinish = async () => {
    if (!story || savingWords) return;
    setSavingWords(true);
    setSaveError("");
    try {
      const wordsToAdd = story.new_words.map(nw => ({
        id: 'reading:' + nw.word + ':' + nw.meaning_mn,
        kana: nw.word,
        kanji: nw.word,
        meaning_mn: nw.meaning_mn,
        romaji: nw.romaji,
        learnedAt: Date.now(),
      }));
      const added = await addLearnedWords(wordsToAdd);
      setAddedCount(added);
      setDialogVisible(true);
    } catch {
      setSaveError('Үгсийг төхөөрөмжид хадгалж чадсангүй. Сул зайгаа шалгаад дахин оролдоно уу.');
    } finally {
      setSavingWords(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Уншлага бэлдэж байна...</Text>
          <Text style={styles.loadingHint}>Таны сурсан үгсэд тохируулахыг оролдож байна</Text>
        </View>
      </Screen>
    );
  }

  if (error || !story) {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={colors.text.muted} />
          <Text style={styles.errorText}>Түүх үүсгэхэд алдаа гарлаа.</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Button label="Буцах" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll scrollBottomInset={100}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{story.sample ? "Жишээ уншлага" : "AI Уншлага"}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{story.title}</Text>
        {story.sample ? <Text style={styles.loadingHint}>AI үйлчилгээ холбогдоогүй тул урьдчилан бэлдсэн жишээ уншлага үзүүлж байна.</Text> : null}
        
        <View style={styles.storyCard}>
          <View style={styles.tokenContainer}>
            {story.story_tokens?.map((token, idx) => {
              // If it's just punctuation, don't make it pressable
              const isPunctuation = !token.romaji && !token.meaning_mn;
              if (isPunctuation) {
                return <Text key={idx} style={styles.storyText}>{token.text}</Text>;
              }
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedToken(token)}
                  style={({ pressed }) => [
                    styles.tokenBtn,
                    pressed && { opacity: 0.6 },
                    selectedToken === token && styles.tokenBtnActive
                  ]}
                >
                  <Text style={[styles.storyText, selectedToken === token && styles.storyTextActive]}>
                    {token.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedToken && (
          <View style={styles.selectedWordBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.selectedWordKana}>{selectedToken.text}</Text>
                <Text style={styles.selectedWordRomaji}>{selectedToken.romaji}</Text>
              </View>
              <Pressable onPress={() => setSelectedToken(null)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={colors.text.muted} />
              </Pressable>
            </View>
            <View style={styles.selectedWordDivider} />
            <Text style={styles.selectedWordMeaning}>{selectedToken.meaning_mn}</Text>
          </View>
        )}

        <Pressable 
          style={styles.translateBtn} 
          onPress={() => setShowTranslation(!showTranslation)}
        >
          <Ionicons name="language" size={20} color={colors.brand.secondary} />
          <Text style={styles.translateBtnText}>
            {showTranslation ? 'Орчуулгыг нуух' : 'Орчуулгыг харах'}
          </Text>
        </Pressable>

        {showTranslation && (
          <View style={styles.translationBox}>
            <Text style={styles.translationText}>{story.translation_mn}</Text>
          </View>
        )}

        <View style={styles.newWordsSection}>
          <Text style={styles.newWordsTitle}>Шинэ үгнүүд</Text>
          <Text style={styles.newWordsSubtitle}>Энэхүү өгүүллэгт орсон шинэ үгс:</Text>
          
          <View style={styles.wordsGrid}>
            {story.new_words.map((nw, idx) => (
              <View key={idx} style={styles.wordCard}>
                <Text style={styles.wordKana}>{nw.word}</Text>
                <Text style={styles.wordRomaji}>{nw.romaji}</Text>
                <Text style={styles.wordMeaning}>{nw.meaning_mn}</Text>
              </View>
            ))}
          </View>
        </View>

        {saveError ? <Text accessibilityRole="alert" style={styles.errorDetail}>{saveError}</Text> : null}
        <Button 
          label={savingWords ? "ХАДГАЛЖ БАЙНА…" : "Уншиж дуусгасан"}
          loading={savingWords}
          disabled={savingWords}
          onPress={() => void handleFinish()}
          style={styles.finishBtn} 
        />
      </View>

      <Dialog
        visible={dialogVisible}
        title="Амжилттай!"
        message={addedCount
          ? addedCount + ' шинэ үгийг дасгалын жагсаалтад нэмлээ.'
          : 'Эдгээр үгс өмнө хадгалагдсан байна. Давхар нэмээгүй.'}
        onClose={() => {
          setDialogVisible(false);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { ...typography.heading.sm, color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
  loadingHint: { ...typography.body.md, color: colors.text.muted, marginTop: spacing.sm },
  errorText: { ...typography.heading.sm, color: colors.text.primary, marginTop: spacing.md },
  errorDetail: { ...typography.body.sm, color: colors.error, marginTop: spacing.sm, textAlign: 'center' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', ...typography.heading.sm, color: colors.text.primary, marginRight: 40,
  },
  
  content: { padding: spacing.md },
  title: {
    fontSize: 28, fontWeight: '800', color: colors.brand.primary, textAlign: 'center',
    marginBottom: spacing.xl, marginTop: spacing.md,
  },
  
  storyCard: {
    backgroundColor: colors.bg.card, borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  tokenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tokenBtn: {
    paddingHorizontal: 2,
    borderRadius: radius.sm,
  },
  tokenBtnActive: {
    backgroundColor: colors.brand.primary + '30',
  },
  storyText: {
    fontSize: 24, lineHeight: 42, fontWeight: '700', color: colors.text.primary,
  },
  storyTextActive: {
    color: colors.brand.primaryDark,
  },
  
  selectedWordBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    ...shadows.md,
  },
  selectedWordKana: { fontSize: 26, fontWeight: '800', color: colors.brand.primary },
  selectedWordRomaji: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  selectedWordDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  selectedWordMeaning: { ...typography.body.lg, fontWeight: '600', color: colors.text.primary },
  
  translateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md, marginTop: spacing.md,
  },
  translateBtnText: { ...typography.body.md, color: colors.brand.secondary, fontWeight: '700' },
  translationBox: {
    backgroundColor: colors.brand.primary + '10', borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.brand.primary + '30', marginTop: spacing.xs,
  },
  translationText: { ...typography.body.md, color: colors.text.primary, lineHeight: 24 },
  
  newWordsSection: {
    marginTop: spacing.xxl, marginBottom: spacing.lg,
  },
  newWordsTitle: { ...typography.heading.md, color: colors.text.primary, textAlign: 'center' },
  newWordsSubtitle: { ...typography.body.sm, color: colors.text.muted, textAlign: 'center', marginBottom: spacing.md },
  wordsGrid: { gap: spacing.sm },
  wordCard: {
    backgroundColor: colors.bg.elevated, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  wordKana: { fontSize: 24, fontWeight: '800', color: colors.brand.primaryDark },
  wordRomaji: { ...typography.body.xs, color: colors.text.muted, marginTop: 2 },
  wordMeaning: { ...typography.body.md, color: colors.text.primary, fontWeight: '600', marginTop: 4 },
  
  finishBtn: { marginTop: spacing.xl },
});
