import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Ionicons } from '@expo/vector-icons';
import { mn } from '@src/i18n/mn';
import { colors } from '@src/theme';

/**
 * Was app/admin/_layout.tsx, which supplied a native header with a per-screen
 * title and a shortcut home. The tab bar is hidden on admin pages, so without
 * this there is no way back out.
 */
const TITLES: Record<string, string> = {
  '/admin': 'Админ',
  '/admin/dashboard': 'Хянах самбар',
  '/admin/exam-import': mn.admin.examPdfImportNavTitle,
  '/admin/lesson-html-import': 'HTML хичээл импорт',
  '/admin/hsk1-lessons': 'HSK 1 хичээлүүд',
  '/admin/learning-path': 'Суралцах зам',
  '/admin/vocabulary': 'Үгийн сан',
  '/admin/cartoons': 'Хүүхэлдэй',
  '/admin/users': 'Хэрэглэгчид',
  '/admin/words': 'Олноор оруулах',
  '/admin/words/new': 'Шинэ үг',
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/admin/word/')) return 'Үг засах';
  if (pathname.startsWith('/admin/lesson-preview/')) return mn.admin.lessonPreviewScreenTitle;
  if (pathname.startsWith('/admin/lesson/')) return 'Хичээл';
  return 'Админ';
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canGoBack = pathname !== '/admin';

  return (
    <div className="admin">
      <header className="admin__bar">
        {canGoBack ? (
          <button
            type="button"
            className="admin__btn"
            onClick={() => navigate(-1)}
            aria-label="Буцах"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </button>
        ) : (
          <span className="admin__btn" aria-hidden="true" />
        )}
        <h1 className="admin__title">{titleFor(pathname)}</h1>
        <button
          type="button"
          className="admin__btn"
          onClick={() => navigate('/home')}
          aria-label={mn.tabs.home}
        >
          <Ionicons name="home-outline" size={24} color={colors.text.primary} />
        </button>
      </header>
      <Outlet />
    </div>
  );
}
