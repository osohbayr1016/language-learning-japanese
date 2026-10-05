import { colors } from '../../theme';
import type { HubShortcut } from './AdminHubBentoCard';

export type AdminHubSectionDef = {
  titleKey: 'hubSectionCourses' | 'hubSectionWords' | 'hubSectionMedia' | 'hubSectionPeople';
  items: HubShortcut[];
};

export const ADMIN_HUB_SECTIONS: AdminHubSectionDef[] = [
  {
    titleKey: 'hubSectionCourses',
    items: [
      {
        title: 'JLPT хичээлүүд',
        icon: 'school',
        color: colors.brand.primary,
        href: '/admin/jlpt-lessons',
      },
      {
        title: 'Суралцах зам',
        icon: 'git-branch',
        color: colors.jlpt[2],
        href: '/admin/learning-path',
      },
      {
        title: 'HTML импорт',
        icon: 'cloud-upload',
        color: colors.jlpt[4],
        href: '/admin/lesson-html-import',
      },
    ],
  },
  {
    titleKey: 'hubSectionWords',
    items: [
      { title: 'Үгийн сан', icon: 'library', color: colors.jlpt[3], href: '/admin/vocabulary' },
      {
        title: 'Шинэ үг',
        icon: 'add-circle',
        color: colors.accent.teal,
        href: '/admin/words/new',
      },
      {
        title: 'Олноор оруулах',
        icon: 'copy',
        color: colors.accent.purple,
        href: '/admin/words',
      },
    ],
  },
  {
    titleKey: 'hubSectionMedia',
    items: [
      {
        title: 'Хүүхэлдэй',
        icon: 'film',
        color: colors.accent.amber,
        href: '/admin/cartoons',
      },
      {
        title: 'Шалгалт (PDF)',
        icon: 'document-text',
        color: colors.brand.secondary,
        href: '/admin/exam-import',
      },
    ],
  },
  {
    titleKey: 'hubSectionPeople',
    items: [
      {
        title: 'Хэрэглэгчид',
        icon: 'people',
        color: colors.text.secondary,
        href: '/admin/users',
      },
    ],
  },
];
