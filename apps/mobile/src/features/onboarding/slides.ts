import onboarding1 from '../../../assets/images/onboarding-1.png';
import onboarding2 from '../../../assets/images/onboarding-2.png';
import onboarding3 from '../../../assets/images/onboarding-3.png';

export type OnboardingSlide = {
  id: string;
  /** Main headline in Japanese (kanji/kana). */
  japanese: string;
  /** Romaji reading aid below the headline. */
  romaji: string;
  /** Copy key matching strings (s1, s2, s3). */
  copyKey: 's1' | 's2' | 's3';
  /** Resolved asset URL. */
  image: string;
};

export const slides: OnboardingSlide[] = [
  {
    id: 's1',
    japanese: 'アニメを見る',
    romaji: 'anime o miru',
    copyKey: 's1',
    image: onboarding1,
  },
  {
    id: 's2',
    japanese: 'ゲームで覚える',
    romaji: 'gēmu de oboeru',
    copyKey: 's2',
    image: onboarding2,
  },
  {
    id: 's3',
    japanese: '毎日続ける',
    romaji: 'mainichi tsuzukeru',
    copyKey: 's3',
    image: onboarding3,
  },
];
