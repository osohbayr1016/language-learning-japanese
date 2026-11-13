import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WordIntroScreen } from "./WordIntroScreen";
import { BookReader } from "../book/BookReader";
import { StrokeOrderPractice } from "../writing/StrokeOrderPractice";
import { SessionDoneScreen } from "../SessionDoneScreen";
import { MOCK_BOOKS } from "../book/mockBooks";
import type { CasualStudyWord } from "./types";
import { CATEGORIES } from "../StudyCasualWords";
import { useRouter } from "expo-router";
import { addLearnedWords, markBookAsRead, isBookRead } from "../../../lib/learnedWordsStorage";

type Phase = "intro" | "reading" | "writing" | "done";

type LearningLoopScreenProps = {
  category: string;
};

export function LearningLoopScreen({ category }: LearningLoopScreenProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionWords, setSessionWords] = useState<CasualStudyWord[]>([]);
  const [bookAlreadyRead, setBookAlreadyRead] = useState(false);
  
  // Aggregate stats from session to show at the very end
  const [sessionStats, setSessionStats] = useState({ xp: 0, correct: 0, total: 0 });

  // Check if the book for this category has already been read
  useEffect(() => {
    const book = MOCK_BOOKS[category];
    if (!book) return;
    isBookRead(book.id).then((read) => setBookAlreadyRead(read)).catch(() => {});
  }, [category]);

  const handleIntroDone = async (words: CasualStudyWord[]) => {
    setSessionStats({ xp: 10 * words.length, correct: words.length, total: words.length });
    setSessionWords(words);

    // Persist the words as learned
    await addLearnedWords(
      words.map((w) => ({
        id: w.id,
        kana: w.kana,
        kanji: w.kanji ?? undefined,
        romaji: w.romaji ?? undefined,
        meaning_mn: w.meaning_mn ?? undefined,
        learnedAt: Date.now(),
        categoryId: category,
      }))
    );
    
    // Check if we have a book for this category, and if it hasn't been read yet
    const book = MOCK_BOOKS[category];
    if (book && !bookAlreadyRead) {
      setPhase("reading");
    } else if (words.length > 0) {
      setPhase("writing");
    } else {
      setPhase("done");
    }
  };

  const handleReadingDone = async () => {
    // Mark this book as read so it never shows again
    const book = MOCK_BOOKS[category];
    if (book) {
      await markBookAsRead(book.id);
    }
    if (sessionWords.length > 0) {
      setPhase("writing");
    } else {
      setPhase("done");
    }
  };

  const handleWritingDone = () => {
    setPhase("done");
  };

  if (phase === "intro") {
    const categoryData = CATEGORIES.find(c => c.id === category);
    const initialWords = categoryData ? categoryData.words as CasualStudyWord[] : [];
    return <WordIntroScreen words={initialWords} onFinish={(w) => void handleIntroDone(w)} />;
  }

  if (phase === "reading") {
    const book = MOCK_BOOKS[category];
    if (!book) {
      void handleReadingDone();
      return null;
    }
    return <BookReader book={book} onFinish={() => void handleReadingDone()} />;
  }

  if (phase === "writing") {
    return <StrokeOrderPractice words={sessionWords} onFinish={handleWritingDone} />;
  }

  if (phase === "done") {
    return (
      <SessionDoneScreen 
        xp={sessionStats.xp} 
        total={sessionStats.total} 
        correct={sessionStats.correct} 
      />
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
