import { request, buildQuery } from './client';
import type { Word, WordWithProgress } from '../types';

export type Streak = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_days_studied: number;
} | null;

export type Stats = {
  total_xp: number;
  words_learned: number;
  words_mastered: number;
  total_reviews: number;
} | null;

export type Profile = {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  /** D1 `users.is_admin` — 1 = админ */
  is_admin?: number;
};

export type Dashboard = {
  user: Profile | null;
  streak: Streak;
  stats: Stats;
  due_today: number;
  today_xp: number;
  daily_xp_goal: number;
};

export type LearningPreferences = {
  self_level: 'none' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1' | null;
  learning_reason: 'university' | 'career' | 'travel' | 'culture' | 'fun' | null;
  daily_xp_goal: number;
  kana_foundation_completed: boolean;
  placement_level: 'n5' | 'n4' | 'n3' | 'n2' | 'n1' | null;
  placement_completed_at: string | null;
};

export type LearningPreferencesPatch = Partial<Pick<
  LearningPreferences,
  'self_level' | 'learning_reason' | 'daily_xp_goal' | 'kana_foundation_completed'
>>;

export type StudyNextAction = {
  kind: 'review' | 'foundation' | 'lesson' | 'weak_skill' | 'explore';
  title: string;
  subtitle: string;
  href: string;
  reason: string;
  lesson_id?: number;
  due_count?: number;
  weak_skill?: string;
};

export type ProgressResult = {
  word_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  response_ms?: number;
  confidence?: number;
};

export type ProgressBody = {
  results: ProgressResult[];
  xp_earned: number;
  session_type: 'flashcard' | 'learn' | 'write' | 'writer';
};

export type VocabularyPage = {
  data: WordWithProgress[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

export const user = {
  dashboard: (token: string) =>
    request<{ data: Dashboard }>('/api/user/dashboard', { token }),
  profile: (token: string) =>
    request<{ data: Profile }>('/api/user/profile', { token }),
  updateProfile: (token: string, body: { display_name?: string; avatar_url?: string }) =>
    request<{ message: string }>('/api/user/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    }),
  streak: (token: string) =>
    request<{ data: Streak }>('/api/user/streak', { token }),
  stats: (token: string) =>
    request<{ data: Stats }>('/api/user/stats', { token }),
  preferences: (token: string) =>
    request<{ data: LearningPreferences }>('/api/user/preferences', { token }),
  updatePreferences: (token: string, body: LearningPreferencesPatch) =>
    request<{ message: string; data: LearningPreferences }>('/api/user/preferences', {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    }),
  nextAction: (token: string) =>
    request<{ data: StudyNextAction }>('/api/user/next-action', { token }),
  dueWords: (token: string, limit = 20) =>
    request<{ data: WordWithProgress[] }>(
      `/api/user/due-words${buildQuery({ limit })}`,
      { token }
    ),
  saveProgress: (token: string, body: ProgressBody) =>
    request<{ message: string; data: { xp_earned: number } }>('/api/user/progress', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  vocabulary: (
    token: string,
    params?: { limit?: number; offset?: number; textbook_unit?: string }
  ) => request<VocabularyPage>(`/api/user/vocabulary${buildQuery(params ?? {})}`, { token }),
  vocabularyWeak: (token: string, params?: { limit?: number }) =>
    request<{ data: WordWithProgress[] }>(
      `/api/user/vocabulary/weak${buildQuery(params ?? {})}`,
      { token }
    ),
  vocabularyFlashcardNow: (token: string, wordId: number) =>
    request<{ message: string }>(`/api/user/vocabulary/${wordId}/eligibility`, {
      method: 'PATCH',
      token,
    }),
  vocabularyWordEntry: (token: string, wordId: number) =>
    request<{ data: WordWithProgress }>(`/api/user/vocabulary/word/${wordId}`, { token }),
};

export type { Word, WordWithProgress };
