import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { useRouter } from 'expo-router';
import { useLearnedWords } from '../../hooks/useLearnedWords';

// ─── Word Categories — Level 1, 2, 3 ────────────────────────────────────────
// Each book for Level 2+ reuses Level 1 words in its story sentences,
// so old vocabulary is constantly reviewed while new words are introduced.
export const CATEGORIES = [
  // ── Level 1 ─────────────────────────────────────────────────────────────
  {
    id: 'animals', level: 1,
    title: 'Амьтад', subtitle: 'Амьтдын энгийн нэршил',
    icon: 'paw', color: colors.accent.amber,
    words: [
      { id: 'cat',  kana: 'ねこ',   kanji: '猫',  meaning_mn: 'Муур',   romaji: 'neko' },
      { id: 'dog',  kana: 'いぬ',   kanji: '犬',  meaning_mn: 'Нохой',  romaji: 'inu' },
      { id: 'bird', kana: 'とり',   kanji: '鳥',  meaning_mn: 'Шувуу',  romaji: 'tori' },
      { id: 'fish', kana: 'さかな', kanji: '魚',  meaning_mn: 'Загас',  romaji: 'sakana' },
      { id: 'bear', kana: 'くま',   kanji: '熊',  meaning_mn: 'Баавгай', romaji: 'kuma' },
    ],
  },
  {
    id: 'actions', level: 1,
    title: 'Үйлдэлүүд', subtitle: 'Хамгийн түгээмэл үйл үгс',
    icon: 'walk', color: colors.accent.teal,
    words: [
      { id: 'walk',  kana: 'あるく',  kanji: '歩く',   meaning_mn: 'Алхах',     romaji: 'aruku' },
      { id: 'eat',   kana: 'たべる',  kanji: '食べる', meaning_mn: 'Идэх',      romaji: 'taberu' },
      { id: 'drink', kana: 'のむ',    kanji: '飲む',   meaning_mn: 'Уух',       romaji: 'nomu' },
      { id: 'learn', kana: 'まなぶ',  kanji: '学ぶ',   meaning_mn: 'Сурах',     romaji: 'manabu' },
      { id: 'sleep', kana: 'ねる',    kanji: '寝る',   meaning_mn: 'Унтах',     romaji: 'neru' },
      { id: 'see',   kana: 'みる',    kanji: '見る',   meaning_mn: 'Харах',     romaji: 'miru' },
    ],
  },
  {
    id: 'objects', level: 1,
    title: 'Эд зүйлс', subtitle: 'Эргэн тойрны зүйлс',
    icon: 'cube', color: colors.accent.pink,
    words: [
      { id: 'book',  kana: 'ほん',   kanji: '本',   meaning_mn: 'Ном',     romaji: 'hon' },
      { id: 'desk',  kana: 'つくえ', kanji: '机',   meaning_mn: 'Ширээ',   romaji: 'tsukue' },
      { id: 'pen',   kana: 'ペン',   kanji: 'ペン', meaning_mn: 'Үзэг',   romaji: 'pen' },
      { id: 'bag',   kana: 'かばん', kanji: '鞄',   meaning_mn: 'Цүнх',   romaji: 'kaban' },
      { id: 'water-bottle', kana: 'みずのボトル', kanji: '水のボトル', meaning_mn: 'Усны сав', romaji: 'mizu no botoru' },
    ],
  },
  // ── Level 2 — reuses Level 1 vocab in book stories ──────────────────────
  {
    id: 'feelings', level: 2,
    title: 'Мэдрэмж', subtitle: '猫・犬 + шинэ мэдрэмжийн үгс',
    icon: 'happy-outline', color: '#f472b6',
    words: [
      { id: 'happy',  kana: 'うれしい',  kanji: '嬉しい', meaning_mn: 'Баяртай',       romaji: 'ureshii' },
      { id: 'sad',    kana: 'かなしい',  kanji: '悲しい', meaning_mn: 'Гунигтай',      romaji: 'kanashii' },
      { id: 'fun',    kana: 'たのしい',  kanji: '楽しい', meaning_mn: 'Тааламжтай',    romaji: 'tanoshii' },
      { id: 'scary',  kana: 'こわい',    kanji: '怖い',   meaning_mn: 'Айдастай',      romaji: 'kowai' },
      { id: 'cute',   kana: 'かわいい',  kanji: '可愛い', meaning_mn: 'Хөөрхий',       romaji: 'kawaii' },
      { id: 'tired',  kana: 'つかれた',  kanji: '疲れた', meaning_mn: 'Ядарсан',       romaji: 'tsukareta' },
    ],
  },
  {
    id: 'food', level: 2,
    title: 'Хоол хүнс', subtitle: '食べる・飲む + шинэ хоолны үгс',
    icon: 'restaurant-outline', color: '#f97316',
    words: [
      { id: 'apple',  kana: 'りんご',       kanji: 'りんご',  meaning_mn: 'Алим',            romaji: 'ringo' },
      { id: 'water',  kana: 'みず',          kanji: '水',       meaning_mn: 'Ус',              romaji: 'mizu' },
      { id: 'rice',   kana: 'ごはん',        kanji: 'ご飯',    meaning_mn: 'Будаа / Хоол',   romaji: 'gohan' },
      { id: 'bread',  kana: 'パン',          kanji: 'パン',    meaning_mn: 'Талх',            romaji: 'pan' },
      { id: 'milk',   kana: 'ぎゅうにゅう', kanji: '牛乳',    meaning_mn: 'Сүү',             romaji: 'gyuunyuu' },
      { id: 'tea',    kana: 'おちゃ',        kanji: 'お茶',    meaning_mn: 'Цай',             romaji: 'ocha' },
    ],
  },
  {
    id: 'places', level: 2,
    title: 'Газар орон', subtitle: '歩く・見る + байршлын үгс',
    icon: 'location-outline', color: '#22d3ee',
    words: [
      { id: 'school',  kana: 'がっこう', kanji: '学校', meaning_mn: 'Сургууль',              romaji: 'gakkou' },
      { id: 'house',   kana: 'いえ',     kanji: '家',   meaning_mn: 'Гэр',                   romaji: 'ie' },
      { id: 'park',    kana: 'こうえん', kanji: '公園', meaning_mn: 'Цэцэрлэгт хүрээлэн',   romaji: 'kouen' },
      { id: 'shop',    kana: 'みせ',     kanji: '店',   meaning_mn: 'Дэлгүүр',               romaji: 'mise' },
      { id: 'station', kana: 'えき',     kanji: '駅',   meaning_mn: 'Галт тэрэгний буудал',  romaji: 'eki' },
    ],
  },
  // ── Level 3 — uses ALL previous vocabulary ───────────────────────────────
  {
    id: 'family', level: 3,
    title: 'Гэр бүл', subtitle: 'Амьтад・мэдрэмж・хоол бүгдийг хэрэглэнэ',
    icon: 'people-outline', color: '#a78bfa',
    words: [
      { id: 'mother',   kana: 'おかあさん', kanji: 'お母さん', meaning_mn: 'Ээж',          romaji: 'okaasan' },
      { id: 'father',   kana: 'おとうさん', kanji: 'お父さん', meaning_mn: 'Аав',          romaji: 'otousan' },
      { id: 'brother',  kana: 'あに',       kanji: '兄',       meaning_mn: 'Ах',           romaji: 'ani' },
      { id: 'sister',   kana: 'いもうと',   kanji: '妹',       meaning_mn: 'Дүү (эм)',     romaji: 'imouto' },
      { id: 'friend',   kana: 'ともだち',   kanji: '友達',     meaning_mn: 'Найз',         romaji: 'tomodachi' },
      { id: 'grandma',  kana: 'おばあさん', kanji: 'お婆さん', meaning_mn: 'Эмэг эх',     romaji: 'obaasan' },
    ],
  },
  {
    id: 'time', level: 3,
    title: 'Цаг хугацаа', subtitle: '今日・明日 + өдрийн хэв маяг',
    icon: 'time-outline', color: '#34d399',
    words: [
      { id: 'today',    kana: 'きょう', kanji: '今日', meaning_mn: 'Өнөөдөр',  romaji: 'kyou' },
      { id: 'tomorrow', kana: 'あした', kanji: '明日', meaning_mn: 'Маргааш',  romaji: 'ashita' },
      { id: 'morning',  kana: 'あさ',   kanji: '朝',   meaning_mn: 'Өглөө',    romaji: 'asa' },
      { id: 'night',    kana: 'よる',   kanji: '夜',   meaning_mn: 'Шөнө',     romaji: 'yoru' },
      { id: 'now',      kana: 'いま',   kanji: '今',   meaning_mn: 'Одоо',     romaji: 'ima' },
      { id: 'always',   kana: 'いつも', kanji: 'いつも', meaning_mn: 'Үргэлж', romaji: 'itsumo' },
    ],
  },
];

export function StudyCasualWords() {
  const router = useRouter();
  const { words: learnedWords } = useLearnedWords();
  const learnedIds = new Set(learnedWords.map((w) => String(w.id)));

  const handlePressWord = (categoryId: string) => {
    router.push(`/study/loop?category=${categoryId}`);
  };

  const handleViewAll = (categoryId: string) => {
    router.push(`/study/category-words?category=${categoryId}` as any);
  };

  const levels: Record<number, typeof CATEGORIES> = {};
  for (const cat of CATEGORIES) {
    if (!levels[cat.level]) levels[cat.level] = [];
    levels[cat.level].push(cat);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Үг хэллэгийн дасгал</Text>
      <Text style={styles.mainSubtitle}>Хираганаар эхэлж, аажмаар ханз руу шилжих болно.</Text>

      {Object.entries(levels).map(([lvl, cats]) => {
        const activeCats = cats.filter(cat => cat.words.some(w => !learnedIds.has(String(w.id))));
        if (activeCats.length === 0) return null;

        return (
          <View key={lvl}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Түвшин {lvl}</Text>
              </View>
              <View style={styles.levelLine} />
            </View>

            {activeCats.map((category) => {
              const unlearnedWords = category.words.filter((w) => !learnedIds.has(String(w.id)));
              const displayWords = unlearnedWords;

            return (
              <View key={category.id} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: category.color + '22' }]}>
                    <Ionicons name={category.icon as any} size={20} color={category.color} />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                  </View>
                  {unlearnedWords.length < category.words.length && (
                    <View style={styles.progressBadge}>
                      <Text style={[styles.progressText, { color: category.color }]}>
                        {category.words.length - unlearnedWords.length}/{category.words.length}
                      </Text>
                    </View>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {displayWords.slice(0, 4).map((word) => (
                    <Pressable
                      key={word.id}
                      style={({ pressed }) => [styles.wordCard, pressed && styles.wordCardPressed]}
                      onPress={() => handlePressWord(category.id)}
                    >
                      <View style={styles.kanaWrap}>
                        <Text
                          style={[styles.kana, { color: category.color }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {word.kana}
                        </Text>
                        {word.kanji !== word.kana ? <Text style={styles.kanji}>{word.kanji}</Text> : null}
                      </View>
                      <Text style={styles.meaning}>{word.meaning_mn}</Text>
                      <Text style={styles.romaji}>{word.romaji}</Text>
                    </Pressable>
                  ))}

                  <Pressable
                    style={[styles.viewAllCard, { borderColor: category.color + '60' }]}
                    onPress={() => handleViewAll(category.id)}
                  >
                    <Ionicons name="list" size={22} color={category.color} />
                    <Text style={[styles.viewAllText, { color: category.color }]}>Бүгд</Text>
                  </Pressable>
                </ScrollView>
              </View>
            );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  mainTitle: {
    ...typography.heading.lg,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  mainSubtitle: {
    ...typography.body.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  levelBadge: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelBadgeText: {
    ...typography.body.xs,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  levelLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  categoryBlock: { marginBottom: spacing.xl },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  categoryText: { flex: 1 },
  categoryTitle: { ...typography.heading.sm, color: colors.text.primary },
  categorySubtitle: { ...typography.body.xs, color: colors.text.secondary },
  scrollContent: { paddingHorizontal: spacing.md, gap: spacing.md },
  wordCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    // Wide enough for a five-mora word (おかあさん) on one line at 24 px.
    width: 148,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  wordCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  kanaWrap: { alignItems: 'center', marginBottom: spacing.sm, height: 50, justifyContent: 'center' },
  kana: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  kanji: { fontSize: 13, color: colors.text.muted },
  meaning: { ...typography.body.md, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  romaji: { ...typography.body.xs, color: colors.text.secondary, textAlign: 'center', marginTop: 2 },
  viewAllCard: {
    width: 80, borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.elevated,
    paddingVertical: spacing.sm, gap: 4,
  },
  viewAllText: { ...typography.body.sm, fontWeight: '700', marginTop: 4 },
  progressBadge: {
    backgroundColor: colors.bg.elevated, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  progressText: { ...typography.body.xs, fontWeight: '700' },
});
