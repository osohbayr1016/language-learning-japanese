import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { colors } from '../../src/theme';
import { mn } from '../../src/i18n/mn';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const ROUTES: { name: string; label: string; icon: TabIconName; activeIcon: TabIconName }[] = [
  { name: 'home', label: mn.tabs.home, icon: 'home-outline', activeIcon: 'home' },
  { name: 'study', label: mn.tabs.study, icon: 'book-outline', activeIcon: 'book' },
  { name: 'kanji', label: mn.tabs.kanji, icon: 'language-outline', activeIcon: 'language' },
  { name: 'games', label: mn.tabs.kana, icon: 'apps-outline', activeIcon: 'apps' },
  { name: 'profile', label: mn.tabs.profile, icon: 'person-outline', activeIcon: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {ROUTES.map((r) => (
        <Tabs.Screen
          key={r.name}
          name={r.name}
          options={{
            title: r.label,
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color }}>{r.label}</Text>
            ),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? r.activeIcon : r.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
