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
