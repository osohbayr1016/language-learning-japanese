import type { ImageSourcePropType } from 'react-native';
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
  image: ImageSourcePropType;
};

// Metro resolves bundled images to numeric asset IDs, while web may return a URL.
const imageSource = (asset: string | number): ImageSourcePropType =>
  typeof asset === 'string' ? { uri: asset } : asset;

export const slides: OnboardingSlide[] = [
  {
    id: 's1',
    japanese: 'こんにちは',
    romaji: 'konnichiwa',
    copyKey: 's1',
    image: imageSource(onboarding1),
  },
  {
    id: 's2',
    japanese: '少しずつ',
    romaji: 'sukoshi zutsu',
    copyKey: 's2',
    image: imageSource(onboarding2),
  },
  {
    id: 's3',
    japanese: 'できる！',
    romaji: 'dekiru!',
    copyKey: 's3',
    image: imageSource(onboarding3),
  },
];
