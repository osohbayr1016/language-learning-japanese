import { Hono } from 'hono';
import { Env, Variables } from '../types';

export const readingRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

readingRouter.post('/generate', async (c) => {
  const { learnedWords } = await c.req.json<{ learnedWords: string[] }>();
  
  if (!c.env.AI && !c.env.GEMINI_API_KEY) {
    // Return a mock story if neither AI binding nor Gemini API key is configured
    return c.json({
      title: 'ねこといぬ (Mock)',
      translation_mn: 'Эрт урьд цагт, муур нохой хоёр байжээ. Муур "няа" гэж дуугарав. Нохой "ван" гэж дуугарав. Тэд маш сайн найзууд байлаа.',
      new_words: [
        { word: 'むかし', meaning_mn: 'эрт урьд цагт', romaji: 'mukashi' },
        { word: 'なかよし', meaning_mn: 'сайн найз', romaji: 'nakayoshi' }
      ],
      story_tokens: [
        { text: 'むかしむかし', romaji: 'mukashimukashi', meaning_mn: 'эрт урьд цагт' },
        { text: '、', romaji: '', meaning_mn: '' },
        { text: 'ねこ', romaji: 'neko', meaning_mn: 'муур' },
        { text: 'と', romaji: 'to', meaning_mn: 'ба' },
        { text: 'いぬ', romaji: 'inu', meaning_mn: 'нохой' },
        { text: 'が', romaji: 'ga', meaning_mn: '' },
        { text: 'いました', romaji: 'imashita', meaning_mn: 'байжээ' },
        { text: '。', romaji: '', meaning_mn: '' },
        { text: 'ねこ', romaji: 'neko', meaning_mn: 'муур' },
        { text: 'は', romaji: 'wa', meaning_mn: '' },
        { text: '「にゃー」', romaji: 'nyaa', meaning_mn: 'мяав' },
        { text: 'と', romaji: 'to', meaning_mn: 'гэж' },
        { text: 'なきました', romaji: 'nakimashita', meaning_mn: 'дуугарав' },
        { text: '。', romaji: '', meaning_mn: '' },
        { text: 'いぬ', romaji: 'inu', meaning_mn: 'нохой' },
        { text: 'は', romaji: 'wa', meaning_mn: '' },
        { text: '「わん」', romaji: 'wan', meaning_mn: 'хов' },
        { text: 'と', romaji: 'to', meaning_mn: 'гэж' },
        { text: 'なきました', romaji: 'nakimashita', meaning_mn: 'дуугарав' },
        { text: '。', romaji: '', meaning_mn: '' },
        { text: 'ふたり', romaji: 'futari', meaning_mn: 'тэд хоёр' },
        { text: 'は', romaji: 'wa', meaning_mn: '' },
        { text: 'とても', romaji: 'totemo', meaning_mn: 'маш' },
        { text: 'なかよし', romaji: 'nakayoshi', meaning_mn: 'сайн найз' },
        { text: 'でした', romaji: 'deshita', meaning_mn: 'байлаа' },
        { text: '。', romaji: '', meaning_mn: '' }
      ]
    });
  }

  const prompt = `You are a professional Japanese to Mongolian (Монгол хэл) translator and Japanese teacher.
Create a very simple Japanese short story in Hiragana for a beginner student.

CRITICAL INSTRUCTIONS:
1. Write 3-4 simple sentences in Japanese using ONLY Hiragana.
2. The vocabulary must be very basic. Use some of these known words: [ ${learnedWords.join(', ')} ].
3. Introduce EXACTLY 2 new Japanese words not in the known list.
4. The Mongolian translations (meaning_mn and translation_mn) MUST be 100% accurate. Use standard dictionary definitions. Do NOT guess or hallucinate words.

Dictionary references for common words (use accurate Mongolian):
- ねこ (neko) = Муур
- いぬ (inu) = Нохой
- さようなら (sayounara) = Баяртай
- おいしい (oishii) = Амттай
- わたし (watashi) = Би
- こんにちは (konnichiwa) = Сайн байна уу
- ありがどう (arigatou) = Баярлалаа

For Japanese particles, use ONLY these short Mongolian forms:
- は (wa): meaning_mn = "-нь/-бол"
- を (o): meaning_mn = "-ыг/-ийг"
- が (ga): meaning_mn = "-нь/-ч"
- に (ni): meaning_mn = "-д/-т/-руу"
- の (no): meaning_mn = "-ын/-ийн"
- と (to): meaning_mn = "болон"
- で (de): meaning_mn = "-аар/-д"
- も (mo): meaning_mn = "бас гэж"
- か (ka): meaning_mn = "уу?"
- や (ya): meaning_mn = "-бууд/-ийг"

Return ONLY strict JSON matching exactly this schema:
{
  "title": "Story title in Hiragana",
  "translation_mn": "Accurate Mongolian translation of the whole story",
  "new_words": [
    {
      "word": "The new word in Hiragana",
      "meaning_mn": "Accurate Mongolian meaning",
      "romaji": "Romaji reading"
    }
  ],
  "story_tokens": [
    {
      "text": "Japanese word/token in Hiragana",
      "romaji": "Romaji reading",
      "meaning_mn": "Mongolian meaning or Particle explanation"
    }
  ]
}`;

  try {
    let text = '';

    if (c.env.GEMINI_API_KEY) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json() as any;
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (c.env.AI) {
      // Use Cloudflare Workers AI with Llama 3.3 70B
      const aiResponse = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: 'You are a Japanese API. You must ONLY output valid JSON. No markdown, no explanations, no codeblocks. Do not truncate the JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048
      }) as any;
      
      // Some AI models return { response: string } or { response: { ... } }
      // If it fails or returns error, it might be an object without .response
      if (typeof aiResponse === 'string') {
        text = aiResponse;
      } else if (aiResponse && typeof aiResponse.response === 'string') {
        text = aiResponse.response;
      } else if (aiResponse && typeof aiResponse.response === 'object') {
        // Cloudflare AI parsed the JSON automatically!
        return c.json(aiResponse.response);
      } else {
        throw new Error(`AI returned invalid format: ${JSON.stringify(aiResponse)}`);
      }
    }

    if (typeof text !== 'string') {
      throw new Error('AI response text is not a string');
    }

    // Clean up potential markdown blocks from AI models
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Find the first { and last } to ensure we only parse the JSON object
    const startIndex = cleaned.indexOf('{');
    const endIndex = cleaned.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      return c.json(parsed);
    } catch (parseError) {
      console.error('JSON parsing failed. Raw output:', cleaned);
      // Fallback to mock data if AI produces invalid JSON
      return c.json({
        title: 'ねこといぬ (AI Error Fallback)',
        translation_mn: 'Эрт урьд цагт, муур нохой хоёр байжээ. Муур "няа" гэж дуугарав. Нохой "ван" гэж дуугарав. Тэд маш сайн найзууд байлаа.',
        new_words: [
          { word: 'むかし', meaning_mn: 'эрт урьд цагт', romaji: 'mukashi' },
          { word: 'なかよし', meaning_mn: 'сайн найз', romaji: 'nakayoshi' }
        ],
        story_tokens: [
          { text: 'むかしむかし', romaji: 'mukashimukashi', meaning_mn: 'эрт урьд цагт' },
          { text: '、', romaji: '', meaning_mn: '' },
          { text: 'ねこ', romaji: 'neko', meaning_mn: 'муур' },
          { text: 'と', romaji: 'to', meaning_mn: 'ба' },
          { text: 'いぬ', romaji: 'inu', meaning_mn: 'нохой' },
          { text: 'が', romaji: 'ga', meaning_mn: '' },
          { text: 'いました', romaji: 'imashita', meaning_mn: 'байжээ' },
          { text: '。', romaji: '', meaning_mn: '' }
        ]
      });
    }
  } catch (error) {
    console.error('Reading generation error:', error);
    return c.json({ error: (error as Error).message }, 500);
  }
});
