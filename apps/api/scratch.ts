import { Hono } from 'hono';

const prompt = `You are a Japanese language teacher creating a short, easy-to-read story for a beginner student.

Requirements:
1. Write a short, engaging story or article (3-4 sentences).
2. USE ONLY HIRAGANA. No Kanji, no Katakana (unless it's a loan word).
3. The story MUST be simple enough for a beginner.
4. Try to use some of these words the student already knows: [].
5. IMPORTANT: Introduce EXACTLY 2 NEW Japanese words that are NOT in the student's known words list.
6. Return the response in strict JSON format matching this schema:
{
  "title": "Story title in Hiragana",
  "translation_mn": "Mongolian translation of the entire story",
  "new_words": [
    {
      "word": "The new word in Hiragana",
      "meaning_mn": "Mongolian meaning",
      "romaji": "Romaji reading"
    }
  ],
  "story_tokens": [
    {
      "text": "Japanese word/token in Hiragana",
      "romaji": "Romaji reading (empty string for punctuation/particles)",
      "meaning_mn": "Mongolian meaning (empty string for punctuation)"
    }
  ]
}

DO NOT include markdown formatting like \`\`\`json. Just output the raw JSON object. Make sure the \`story_tokens\` array represents the full story in sequence.`;

console.log(prompt);
