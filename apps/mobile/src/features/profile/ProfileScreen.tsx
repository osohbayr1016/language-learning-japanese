import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { type Href, useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { api } from '../../lib/api';
import type { Profile } from '../../lib/api/user';
import { isTruthyAdmin } from '../../lib/auth/isTruthyAdmin';
import { mn } from '../../i18n/mn';
import { ProfileHeader } from './ProfileHeader';
import { StatsGrid } from './StatsGrid';
import { ProfileMenu } from './ProfileMenu';

export default function ProfileScreen() {
  const { token, signOut, isAdmin, refreshAdminRole } = useAuth();
  const { stats, streak, refresh } = useGamification();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(() => {
    if (!token) return;
    void (async () => {
      try {
        const p = await api.user.profile(token);
        setProfile(p.data);
      } catch {
        /* ignore */
      }
    })();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (token) void refreshAdminRole();
      loadProfile();
    }, [refresh, token, refreshAdminRole, loadProfile])
  );

  /** D1 `users.is_admin` илэрсэн профайл хариу — JWT/context алдаатай үед ч товч харагдана. */
  const adminFromDbProfile = isTruthyAdmin(profile?.is_admin);
  const showAdminNav = adminFromDbProfile || isAdmin;

  useEffect(() => {
    if (!token || !profile) return;
    if (adminFromDbProfile && !isAdmin) void refreshAdminRole();
  }, [token, profile, adminFromDbProfile, isAdmin, refreshAdminRole]);

  const confirmSignOut = () => {
    if (Platform.OS === 'web') {
      const g = globalThis as { confirm?: (message?: string) => boolean };
      if (g.confirm?.(`${mn.profile.signOut}\n\n${mn.profile.signOutConfirm}`)) {
        void signOut();
      }
      return;
    }
    Alert.alert(mn.profile.signOut, mn.profile.signOutConfirm, [
      { text: mn.common.cancel, style: 'cancel' },
      { text: mn.profile.signOut, style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen scroll>
      <ProfileHeader
        name={profile?.display_name ?? 'Сурагч'}
        email={profile?.email ?? ''}
        avatar={profile?.avatar_url}
        onEditAvatar={() => router.push('/profile/avatar' as Href)}
      />
      <StatsGrid stats={stats} streak={streak} />
      <ProfileMenu
        items={[
          ...(showAdminNav
            ? [
                {
                  key: 'admin',
                  label: mn.profile.admin,
                  icon: 'shield-checkmark-outline' as const,
                  onPress: () => router.push('/admin' as Href),
                },
              ]
            : []),
          {
            key: 'learnedWords',
            label: 'Сурсан үгнүүд',
            icon: 'star-outline' as const,
            onPress: () => router.push('/profile/learned-words' as Href),
          },
          {
            key: 'learnedKanjis',
            label: 'Сурсан ханз',
            icon: 'text-outline' as const,
            onPress: () => router.push('/profile/learned-kanjis' as Href),
          },
          {
            key: 'seenWords',
            label: mn.profile.seenWords,
            icon: 'albums-outline',
            onPress: () => router.push('/profile/vocabulary'),
          },
          {
            key: 'settings',
            label: mn.profile.settings,
            icon: 'settings-outline',
            onPress: () => router.push('/profile/settings'),
          },
          {
            key: 'signOut',
            label: mn.profile.signOut,
            icon: 'log-out-outline',
            onPress: confirmSignOut,
            danger: true,
          },
        ]}
      />
    </Screen>
  );
}
