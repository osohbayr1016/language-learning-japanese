import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { EmptyState, Screen } from '../../primitives';
import { mn } from '../../i18n/mn';

type Props = {
  message?: string;
  /** Tells the state apart: "nothing to do" vs "could not load". */
  kind?: 'empty' | 'error';
};

/**
 * Full-screen "nothing to study here" for the exercise screens.
 *
 * Used a big green check for every case, which read as "you finished" even
 * when the list had failed to load. Now the icon and tone follow the reason.
 */
export function StudyEmptyState({ message, kind = 'empty' }: Props) {
  const router = useRouter();
  const back = () => safeBack(router, '/(tabs)/study');
  return (
    <Screen>
      <View style={styles.center}>
        {kind === 'error' ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="warning"
            title="Ачаалж чадсангүй"
            body={message ?? mn.study.wordsLoadError}
            actionLabel={mn.common.back}
            onAction={back}
          />
        ) : (
          <EmptyState
            icon="leaf-outline"
            tone="success"
            title="Одоогоор давтах зүйл алга"
            body={message ?? mn.study.noWords}
            actionLabel={mn.tabs.study}
            onAction={back}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
