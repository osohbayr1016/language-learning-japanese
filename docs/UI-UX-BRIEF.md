# UI/UX improvement brief — Япон хэл сурах (web)

Written for: the engineer (or agent) doing the next design pass on the website.
Audited on 2026-09-13 at 390×844 (phone) and 1280×800 (desktop) with a fresh
account, every top-level route plus the study, games, profile and kanji screens.

## Product in one line

A Mongolian-language app that teaches Japanese from zero: kana → N5 kanji →
vocabulary with spaced repetition, speaking practice with speech recognition,
and short games. Learners are mostly on phones; some use a laptop.

## Design principles (do not break these)

1. **One visual system.** Colors, spacing, radius, type and motion come from
   `apps/mobile/src/theme`. No hand-written hex, no emoji as icons — Ionicons
   only, at 18/20/22/24 px.
2. **Every screen answers "what do I do now?"** A hub has one obvious primary
   action; an exercise has the question, the answer surface, and a single
   primary button. Nothing else competes.
3. **No dead ends.** Every empty, loading and error state has an icon, one
   sentence in plain Mongolian, and a way forward (retry, go back, or the
   next thing to do). Never a bare sentence on a white page.
4. **Never clip Japanese.** Words like おかあさん must not wrap mid-word or get
   cut by a horizontal scroller. Size the container or shrink the glyphs.
5. **Contrast ≥ 4.5:1 for text**, 3:1 for icons. Selected chips get white text
   on a solid accent, never dark text on purple.
6. **Phone first, desktop honest.** The framed phone column is fine, but at
   ≥ 720 px it should be wide enough (560 px) that hubs breathe and grids show
   more per row.
7. **Consistent chrome.** Sub-screens use one back-bar pattern (round button,
   centered title, optional right slot). Tab screens use the tab bar. Learners
   should never have to guess how to leave a screen.
8. **Copy for learners, not developers.** No table names, no "dev build",
   no English fragments on Mongolian screens.

## Screen-by-screen findings and fixes

### Global
- [x] G1. Add an `EmptyState` primitive (icon in soft circle, title, one line,
      optional primary + secondary action). Use it everywhere below.
- [x] G2. Replace emoji icons with Ionicons: kanji detail activities
      (🔊 ✍️ 📖), AI reading banner (🤖), reading screen (✨ 🎉), setup reason
      cards (🎓 💼 ✈️ 🏮 🎨).
- [x] G3. Selected chip contrast: settings daily-goal chips show dark text on
      purple. Use `text.inverse`.
- [x] G4. Desktop: raise the app column from 480 to 560 px.

### Home
- [x] H1. "Өөр хэсгүүд" is a horizontal scroller that cuts the 4th tile. Make it
      a 4-up grid that fits the column.
- [x] H2. Leaderboard action reads "Тоглоом" but the section is about rank.
      Label it "Бүгд" and route to the games hub where the full board lives.

### Study hub
- [x] S1. Word cards are 130 px; おかあさん wraps to two lines. Widen to 148 px,
      keep kana on one line with auto-shrink.
- [~] S2. Deferred. With the wider cards the third card is cut at the edge,
      which already reads as "scrolls"; a gradient fade needs a native gradient
      dependency the web build does not ship. Revisit if users miss the row.
- [x] S3. Level headers ("Түвшин 1") are fine. Category subtitle uses kanji
      (猫・犬 + …) for level ≥ 2 — fine, that is the review cue.

### Kana hub
- [x] K1. Show romaji under each glyph (あ / a). This is the single most useful
      change for a beginner; the grid currently shows glyphs only.
- [x] K2. Add a row label on the left (a, ka, sa…) so the table reads like the
      standard gojūon chart.
- [x] K3. Header card: title color is brand plum on a teal wash — mismatched.
      Use the teal accent for both.

### Kanji list
- [x] KJ1. Tile text at 10 px is too small; 11 px minimum (done in last pass).
- [x] KJ2. Stroke-order FAB overlaps the tile edge and the next row. Move it
      inside the tile's top-left corner.

### Kanji detail
- [x] KD1. Emoji icons → Ionicons (see G2).
- [x] KD2. Locked "Бүх даалгавраа дуусгасны дараа" button looks disabled with
      no explanation; add a helper line "3 даалгавар дуусгавал сурсан гэж
      тэмдэглэнэ".

### Learn / Flashcard / Write / Speak
- [x] L1. Flashcard fills the viewport with a mostly empty card. Cap the card at
      420 px so the flip hint and controls are visible without scrolling.
- [x] L2. Write: the input sits at the bottom with a 600 px gap. Keep the prompt
      and the input together (input directly under the card).
- [x] L3. Speak: done in last pass (live state, transcript box, Mongolian copy).

### Grammar / Mock exam / Weak review / Vocabulary
- [x] E1. Grammar list empty: bare sentence → EmptyState with "Дахин оролдох"
      and "Буцах".
- [x] E2. Mock exam empty: no header, bare sentence → header + EmptyState.
- [x] E3. Mock exam template picker labels levels "HSK 1" → "JLPT N5" etc.
- [x] E4. Weak review empty uses a green check (reads as success). Use a
      neutral icon and the EmptyState primitive.
- [x] E5. Vocabulary ("Үзсэн үгс") empty: bare sentence → EmptyState linking
      to the study hub.

### Insights
- [x] I1. "Сурсан өдрийн түүх" wraps to three lines beside the range tabs.
      Stack: title on its own row, tabs below.

### Settings
- [x] P1. "Эрх шалгах" card exposes `users.is_admin = 1`. Reword for humans,
      and only show it to accounts that are admins or were opened with
      `?admin=1`.
- [x] P2. Chip contrast (G3).

### Games hub / Match
- [x] GM1. Fine. Match header is cramped at 390 px: shrink the score pill.

## Status (2026-09-13)

All items done except S2 (deferred, see above). Build passes, site redeployed,
screenshots checked at 390 and 1280 for every screen listed.

## Definition of done
- Every checkbox above is either done or explicitly deferred with a reason.
- `npm run build` passes; the site is redeployed; the screenshots in the PR
  show phone (390) and desktop (1280) for Home, Study, Kana, Kanji, Speak,
  Grammar-empty, Settings.
