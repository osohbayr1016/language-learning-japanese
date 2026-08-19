import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, interaction, radius, spacing, typography } from '../../src/theme';
import { mn } from '../../src/i18n/mn';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const ROUTES: {
  name: string;
  label: string;
  icon: TabIconName;
  activeIcon: TabIconName;
  hint: string;
}[] = [
  {
    name: 'home',
    label: mn.tabs.home,
    icon: 'home-outline',
    activeIcon: 'home',
    hint: 'Өнөөдрийн зорилго, давталт',
  },
  {
    name: 'study',
    label: mn.tabs.study,
    icon: 'book-outline',
    activeIcon: 'book',
    hint: 'Хичээл ба дасгалууд',
  },
  {
    name: 'kanji',
    label: mn.tabs.kanji,
    icon: 'language-outline',
    activeIcon: 'language',
    hint: 'Ханз тэмдэгт',
  },
  {
    name: 'games',
    label: mn.tabs.games,
    icon: 'game-controller-outline',
    activeIcon: 'game-controller',
    hint: 'Тоглоом',
  },
  {
    name: 'profile',
    label: mn.tabs.profile,
    icon: 'person-outline',
    activeIcon: 'person',
    hint: 'Профайл ба тохиргоо',
  },
];

/**
 * A tab that shows *where you are* with more than a colour change: the active
 * item gets a filled pill behind its icon, so the current section is readable
 * at a glance and for anyone who can't separate the two tint colours.
 */
function TabItem({
  focused,
  icon,
  activeIcon,
  label,
}: {
  focused: boolean;
  icon: TabIconName;
  activeIcon: TabIconName;
  label: string;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.pill, focused && styles.pillActive]}>
        <Ionicons
          name={focused ? activeIcon : icon}
          size={22}
          color={focused ? colors.brand.primary : colors.text.muted}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, focused ? styles.labelActive : null]}
      >
        {label}
      </Text>
    </View>
  );
}

/** Adds pointer feedback on web, which the default tab button has none of. */
function TabButton(props: React.ComponentProps<typeof Pressable>) {
  const { style, children, ...rest } = props;
  return (
    <Pressable
      {...rest}
      android_ripple={{ color: colors.soft.brand, borderless: true }}
      style={({ pressed, hovered, focused }) => [
        styles.button,
        interaction.web,
        typeof style === 'function' ? style({ pressed, hovered, focused }) : style,
        hovered && !pressed ? styles.buttonHovered : null,
        pressed ? styles.buttonPressed : null,
        focused ? interaction.focusRing : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.barItem,
        tabBarButton: (props) => <TabButton {...(props as React.ComponentProps<typeof Pressable>)} />,
      }}
    >
      {ROUTES.map((r) => (
        <Tabs.Screen
          key={r.name}
          name={r.name}
          options={{
            title: r.label,
            tabBarAccessibilityLabel: `${r.label}. ${r.hint}`,
            tabBarIcon: ({ focused }) => (
              <TabItem
                focused={focused}
                icon={r.icon}
                activeIcon={r.activeIcon}
                label={r.label}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.bg.primary,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 74,
    paddingBottom: 10,
    paddingTop: 8,
    // Lifts the bar off content that scrolls beneath it.
    shadowColor: '#3F2A33',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  barItem: { paddingVertical: 0 },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  buttonHovered: { backgroundColor: colors.bg.washi },
  buttonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  item: { alignItems: 'center', justifyContent: 'center', gap: 2, width: 64 },
  pill: {
    width: 46,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          transitionProperty: 'background-color',
          transitionDuration: '160ms',
        }
      : null),
  },
  pillActive: { backgroundColor: colors.soft.brand },
  label: {
    ...typography.body.xs,
    fontWeight: '600',
    color: colors.text.muted,
    marginTop: spacing.xxs,
  },
  labelActive: { color: colors.brand.primary, fontWeight: '800' },
});
