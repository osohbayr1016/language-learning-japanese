import { request } from './client';

export type DynamicStory = {
  title: string;
  translation_mn: string;
  new_words: Array<{
    word: string;
    meaning_mn: string;
    romaji: string;
  }>;
  story_tokens: Array<{
    text: string;
    romaji: string;
    meaning_mn: string;
  }>;
};

export const reading = {
  async generate(learnedWords: string[]): Promise<DynamicStory> {
    const res = await request('/api/reading/generate', {
      method: 'POST',
      body: JSON.stringify({ learnedWords }),
    });
    return res as DynamicStory;
  },
};
