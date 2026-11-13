import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { mn } from '../../src/i18n/mn';
import { colors } from '../../src/theme';

function AdminHomeHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mn.tabs.home}
      onPress={() => router.replace('/(tabs)/home')}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ marginRight: 4, padding: 4 }}
    >
      <Ionicons name="home-outline" size={24} color={colors.text.primary} />
    </Pressable>
  );
}

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg.primary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => <AdminHomeHeaderButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Админ' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Хянах самбар' }} />
      <Stack.Screen
        name="exam-import"
        options={{ title: mn.admin.examPdfImportNavTitle }}
      />
      <Stack.Screen name="lesson-html-import" options={{ title: 'HTML хичээл импорт' }} />
      <Stack.Screen name="jlpt-n5-lessons" options={{ title: 'JLPT N5 хичээлүүд' }} />
      <Stack.Screen name="learning-path" options={{ title: 'Суралцах зам' }} />
      <Stack.Screen name="vocabulary" options={{ title: 'Үгийн сан' }} />
      <Stack.Screen name="cartoons" options={{ title: 'Хүүхэлдэй' }} />
      <Stack.Screen name="users" options={{ title: 'Хэрэглэгчид' }} />
      <Stack.Screen name="words" options={{ title: 'Олноор оруулах' }} />
      <Stack.Screen name="words/new" options={{ title: 'Шинэ үг' }} />
      <Stack.Screen name="word/[id]" options={{ title: 'Үг засах' }} />
      <Stack.Screen name="lesson/[id]" options={{ title: 'Хичээл' }} />
      <Stack.Screen
        name="lesson-preview/[id]"
        options={{ title: mn.admin.lessonPreviewScreenTitle }}
      />
    </Stack>
  );
}
