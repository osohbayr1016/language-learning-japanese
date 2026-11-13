import { request, buildQuery } from './client';
import type { Word } from '../types';

export type Cartoon = {
  id: number;
  title_mn: string;
  description_mn: string | null;
  thumbnail_url: string | null;
  jlpt_level: number | null;
  duration_s: number;
  is_published: boolean;
};

export type CartoonWord = Word & { start_s: number; end_s: number };

export type CartoonDetail = Cartoon & {
  video_url: string;
  vocab: CartoonWord[];
};

export const cartoons = {
  list: (params: { jlpt?: number } = {}) =>
    request<{ data: Cartoon[] }>(
      `/api/cartoons${buildQuery({ jlpt: params.jlpt })}`
    ),
  get: (id: number, token?: string) =>
    request<{ data: CartoonDetail }>(`/api/cartoons/${id}`, { token }),
};
