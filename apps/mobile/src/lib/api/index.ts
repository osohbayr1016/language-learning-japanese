import { auth } from './auth';
import { user } from './user';
import { words } from './words';
import { courses } from './courses';
import { games } from './games';
import { cartoons } from './cartoons';
import { audio } from './audio';
import { lessons } from './lessons';
import { insights } from './insights';
import { adminApi } from './admin';
import { cartoonsAdmin } from './cartoonsAdmin';
import { grammar } from './grammar';
import { exams } from './exams';
import { reading } from './reading';

export const api = {
  auth,
  user,
  words,
  courses,
  games,
  cartoons,
  cartoonsAdmin,
  audio,
  lessons,
  grammar,
  exams,
  insights,
  reading,
  admin: adminApi,
};

export type { AuthTokens, LoginBody, RegisterBody } from './auth';
export type { Dashboard, Streak, Stats, ProgressBody } from './user';
export type { Course } from './courses';
export type { GameSessionBody, GameType, LeaderboardRow } from './games';
export type { Cartoon, CartoonDetail, CartoonWord } from './cartoons';
export type { LessonCompleteBody } from './lessons';
export { getApiBase } from './client';
