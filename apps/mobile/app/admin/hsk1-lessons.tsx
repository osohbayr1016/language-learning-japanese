import { Redirect } from 'expo-router';

/** Legacy URL kept so old bookmarks continue to work. */
export default function LegacyAdminHskLessonsRedirect() {
  return <Redirect href="/admin/jlpt-lessons" />;
}
