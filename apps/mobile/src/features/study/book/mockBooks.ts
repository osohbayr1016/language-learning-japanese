import type { ImageSourcePropType } from "react-native";

export type BookPage = {
  id: string;
  image: ImageSourcePropType;
  textHiragana: string;
  textKanji: string;
  textRomaji: string;
  translation: string;
  newWords: string[]; // IDs of NEW words featured on this page
  reviewWords: string[]; // IDs of OLD words being reviewed on this page
};

export type Book = {
  id: string;
  categoryId: string;
  title: string;
  level: number;
  pages: BookPage[];
};

import bookAnimals from "../../../../assets/images/book/book_animals_cat_dog_1778909388792.png";
import bookActions from "../../../../assets/images/book/book_actions_1778909521464.png";
import bookFeelings from "../../../../assets/images/book/book_feelings_1778914386125.png";
import bookFood from "../../../../assets/images/book/book_food_1778914468819.png";
import bookPlaces from "../../../../assets/images/book/book_places_1778914757937.png";

/**
 * Metro hands an imported image back as an asset id; Vite hands back a URL.
 * Both end up as something <Image source> accepts. (A CommonJS `require()`
 * here used to throw "require is not defined" and crash the site's learning
 * loop before the first page rendered.)
 */
const asSource = (m: unknown): ImageSourcePropType =>
  (typeof m === "string" ? { uri: m } : m) as ImageSourcePropType;

const IMG = {
  animals:  asSource(bookAnimals),
  actions:  asSource(bookActions),
  feelings: asSource(bookFeelings),
  food:     asSource(bookFood),
  places:   asSource(bookPlaces),
  // Reusing places image for family/time until a new one is generated
  family:   asSource(bookPlaces),
  time:     asSource(bookActions),
};

export const MOCK_BOOKS: Record<string, Book> = {
  // ── Level 1 ──────────────────────────────────────────────────────────────
  animals: {
    id: "book-animals-1", categoryId: "animals", title: "Их найзууд (Great Friends)", level: 1,
    pages: [
      {
        id: "p1", image: IMG.animals,
        textHiragana: "ねこ と いぬ は ともだち です。",
        textKanji:    "猫 と 犬 は 友達 です。",
        textRomaji:   "neko to inu wa tomodachi desu.",
        translation:  "Муур нохой хоёр бол найзууд.",
        newWords: ["cat","dog"], reviewWords: [],
      },
      {
        id: "p2", image: IMG.animals,
        textHiragana: "とり は そら を とびます。さかな は みず の なか に います。",
        textKanji:    "鳥 は 空 を 飛びます。魚 は 水 の 中 に います。",
        textRomaji:   "Tori wa sora o tobimasu. Sakana wa mizu no naka ni imasu.",
        translation:  "Шувуу тэнгэрт нисдэг. Загас усны дотор байдаг.",
        newWords: ["bird","fish"], reviewWords: ["cat","dog"],
      },
      {
        id: "p3", image: IMG.animals,
        textHiragana: "くま は おおきい です。ねこ は かわいい です。",
        textKanji:    "熊 は 大きい です。猫 は 可愛い です。",
        textRomaji:   "Kuma wa ookii desu. Neko wa kawaii desu.",
        translation:  "Баавгай том. Муур хөөрхий.",
        newWords: ["bear"], reviewWords: ["cat","fish","bird"],
      },
    ],
  },

  actions: {
    id: "book-actions-1", categoryId: "actions", title: "Өдөр тутмын амьдрал (Daily Life)", level: 1,
    pages: [
      {
        id: "p1", image: IMG.actions,
        textHiragana: "いぬ は まいにち あるく。",
        textKanji:    "犬 は 毎日 歩く。",
        textRomaji:   "Inu wa mainichi aruku.",
        translation:  "Нохой өдөр бүр алхдаг.",
        newWords: ["walk"], reviewWords: ["dog"],
      },
      {
        id: "p2", image: IMG.actions,
        textHiragana: "ねこ は りんご を たべる。いぬ は みず を のむ。",
        textKanji:    "猫 は りんご を 食べる。犬 は 水 を 飲む。",
        textRomaji:   "Neko wa ringo o taberu. Inu wa mizu o nomu.",
        translation:  "Муур алим идэнэ. Нохой ус уудаг.",
        newWords: ["eat","drink"], reviewWords: ["cat","dog"],
      },
      {
        id: "p3", image: IMG.actions,
        textHiragana: "とり は ほん で まなぶ。そして よる に ねる。",
        textKanji:    "鳥 は 本 で 学ぶ。そして 夜 に 寝る。",
        textRomaji:   "Tori wa hon de manabu. Soshite yoru ni neru.",
        translation:  "Шувуу номоор сурдаг. Тэгээд шөнө унтдаг.",
        newWords: ["learn","sleep"], reviewWords: ["bird"],
      },
    ],
  },

  objects: {
    id: "book-objects-1", categoryId: "objects", title: "Ширээн дээрх зүйлс", level: 1,
    pages: [
      {
        id: "p1", image: IMG.actions,
        textHiragana: "つくえ の うえ に ほん が あります。",
        textKanji:    "机 の 上 に 本 が あります。",
        textRomaji:   "Tsukue no ue ni hon ga arimasu.",
        translation:  "Ширээн дээр ном байна.",
        newWords: ["book","desk"], reviewWords: [],
      },
      {
        id: "p2", image: IMG.actions,
        textHiragana: "ねこ は ペン と かばん を みる。",
        textKanji:    "猫 は ペン と 鞄 を 見る。",
        textRomaji:   "Neko wa pen to kaban o miru.",
        translation:  "Муур үзэг, цүнхийг харна.",
        newWords: ["pen","bag"], reviewWords: ["cat","see"],
      },
    ],
  },

  // ── Level 2 — story REUSES Level 1 words in context ──────────────────────
  feelings: {
    id: "book-feelings-1", categoryId: "feelings", title: "Нохой уйлав (The Dog Cried)", level: 2,
    pages: [
      {
        id: "p1", image: IMG.feelings,
        textHiragana: "きょう、ねこ は うれしい です。たのしく あそびます。",
        textKanji:    "今日、猫 は 嬉しい です。楽しく 遊びます。",
        textRomaji:   "Kyou, neko wa ureshii desu. Tanoshiku asobimasu.",
        translation:  "Өнөөдөр муур баяртай байна. Сайхан тоглоно.",
        newWords: ["happy","fun"], reviewWords: ["cat"],
      },
      {
        id: "p2", image: IMG.feelings,
        textHiragana: "あめ が ふりました。いぬ は かなしい です。",
        textKanji:    "雨 が 降りました。犬 は 悲しい です。",
        textRomaji:   "Ame ga furimashita. Inu wa kanashii desu.",
        translation:  "Бороо орлоо. Нохой гунигтай байна.",
        newWords: ["sad"], reviewWords: ["dog"],
      },
      {
        id: "p3", image: IMG.feelings,
        textHiragana: "ねこ は かわいい いぬ を みました。いぬ は つかれた です。",
        textKanji:    "猫 は 可愛い 犬 を 見ました。犬 は 疲れた です。",
        textRomaji:   "Neko wa kawaii inu o mimashita. Inu wa tsukareta desu.",
        translation:  "Муур хөөрхий нохойг харлаа. Нохой ядарсан байна.",
        newWords: ["cute","tired"], reviewWords: ["cat","dog","see"],
      },
    ],
  },

  food: {
    id: "book-food-1", categoryId: "food", title: "Хоолны цаг (Meal Time)", level: 2,
    pages: [
      {
        id: "p1", image: IMG.food,
        textHiragana: "いぬ は ごはん を たべます。ねこ も たべます。",
        textKanji:    "犬 は ご飯 を 食べます。猫 も 食べます。",
        textRomaji:   "Inu wa gohan o tabemasu. Neko mo tabemasu.",
        translation:  "Нохой будаа идэнэ. Муур ч мөн идэнэ.",
        newWords: ["rice"], reviewWords: ["dog","cat","eat"],
      },
      {
        id: "p2", image: IMG.food,
        textHiragana: "とり は りんご を たべる。みず も のむ。",
        textKanji:    "鳥 は りんご を 食べる。水 も 飲む。",
        textRomaji:   "Tori wa ringo o taberu. Mizu mo nomu.",
        translation:  "Шувуу алим идэнэ. Ус ч мөн уудаг.",
        newWords: ["apple","water"], reviewWords: ["bird","eat","drink"],
      },
      {
        id: "p3", image: IMG.food,
        textHiragana: "おかあさん は パン と おちゃ を つくりました。",
        textKanji:    "お母さん は パン と お茶 を 作りました。",
        textRomaji:   "Okaasan wa pan to ocha o tsukurimashita.",
        translation:  "Ээж талх, цай хийлээ.",
        newWords: ["bread","tea"], reviewWords: ["mother"],
      },
    ],
  },

  places: {
    id: "book-places-1", categoryId: "places", title: "Хот дотор (Around Town)", level: 2,
    pages: [
      {
        id: "p1", image: IMG.places,
        textHiragana: "ねこ は がっこう へ あるく。",
        textKanji:    "猫 は 学校 へ 歩く。",
        textRomaji:   "Neko wa gakkou e aruku.",
        translation:  "Муур сургууль руу алхана.",
        newWords: ["school"], reviewWords: ["cat","walk"],
      },
      {
        id: "p2", image: IMG.places,
        textHiragana: "いぬ は こうえん で あそぶ。とり は いえ を みる。",
        textKanji:    "犬 は 公園 で 遊ぶ。鳥 は 家 を 見る。",
        textRomaji:   "Inu wa kouen de asobu. Tori wa ie o miru.",
        translation:  "Нохой цэцэрлэгт хүрээлэнд тоглоно. Шувуу гэрийг харна.",
        newWords: ["park","house"], reviewWords: ["dog","bird","see"],
      },
      {
        id: "p3", image: IMG.places,
        textHiragana: "みせ で パン を かいました。えき で ともだち に あいました。",
        textKanji:    "店 で パン を 買いました。駅 で 友達 に 会いました。",
        textRomaji:   "Mise de pan o kaimashita. Eki de tomodachi ni aimashita.",
        translation:  "Дэлгүүрт талх авлаа. Станцад найзтай уулзлаа.",
        newWords: ["shop","station"], reviewWords: ["bread","friend"],
      },
    ],
  },

  // ── Level 3 — ALL previous vocab in one story ────────────────────────────
  family: {
    id: "book-family-1", categoryId: "family", title: "Миний гэр бүл (My Family)", level: 3,
    pages: [
      {
        id: "p1", image: IMG.family,
        textHiragana: "おかあさん と おとうさん は うれしい です。",
        textKanji:    "お母さん と お父さん は 嬉しい です。",
        textRomaji:   "Okaasan to otousan wa ureshii desu.",
        translation:  "Ээж, аав хоёр баяртай байна.",
        newWords: ["mother","father"], reviewWords: ["happy"],
      },
      {
        id: "p2", image: IMG.family,
        textHiragana: "あに は がっこう へ あるく。いもうと は かわいい ねこ を みる。",
        textKanji:    "兄 は 学校 へ 歩く。妹 は 可愛い 猫 を 見る。",
        textRomaji:   "Ani wa gakkou e aruku. Imouto wa kawaii neko o miru.",
        translation:  "Ах сургууль руу алхана. Дүү хөөрхий мuurыг харна.",
        newWords: ["brother","sister"], reviewWords: ["school","walk","cute","cat","see"],
      },
      {
        id: "p3", image: IMG.family,
        textHiragana: "ともだち と こうえん で ごはん を たべました。たのしかった！",
        textKanji:    "友達 と 公園 で ご飯 を 食べました。楽しかった！",
        textRomaji:   "Tomodachi to kouen de gohan o tabemashita. Tanoshikatta!",
        translation:  "Найзтайгаа цэцэрлэгт хүрээлэнд будаа идлээ. Сайхан байлаа!",
        newWords: ["friend"], reviewWords: ["park","rice","eat","fun"],
      },
    ],
  },

  time: {
    id: "book-time-1", categoryId: "time", title: "Нохойн өдөр (Dog's Day)", level: 3,
    pages: [
      {
        id: "p1", image: IMG.time,
        textHiragana: "あさ、いぬ は うれしく おきます。きょう は たのしい です。",
        textKanji:    "朝、犬 は 嬉しく 起きます。今日 は 楽しい です。",
        textRomaji:   "Asa, inu wa ureshiku okimasu. Kyou wa tanoshii desu.",
        translation:  "Өглөө нохой баяртай босоно. Өнөөдөр тааламжтай.",
        newWords: ["morning","today"], reviewWords: ["dog","happy","fun"],
      },
      {
        id: "p2", image: IMG.actions,
        textHiragana: "いま、いぬ は こうえん で あるく。ともだち と あそぶ。",
        textKanji:    "今、犬 は 公園 で 歩く。友達 と 遊ぶ。",
        textRomaji:   "Ima, inu wa kouen de aruku. Tomodachi to asobu.",
        translation:  "Одоо нохой цэцэрлэгт хүрээлэнд алхана. Найзтайгаа тоглоно.",
        newWords: ["now"], reviewWords: ["dog","park","walk","friend"],
      },
      {
        id: "p3", image: IMG.time,
        textHiragana: "よる、いぬ は つかれた です。あした また あそびます。",
        textKanji:    "夜、犬 は 疲れた です。明日 また 遊びます。",
        textRomaji:   "Yoru, inu wa tsukareta desu. Ashita mata asobimasu.",
        translation:  "Шөнө нохой ядарчихлаа. Маргааш дахиад тоглоно.",
        newWords: ["night","tomorrow"], reviewWords: ["dog","tired"],
      },
    ],
  },
};
