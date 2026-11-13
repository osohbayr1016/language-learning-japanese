import React from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { bulkKanjiStyles as styles } from './AdminBulkKanjiPaste.styles';
import { mn } from '../../i18n/mn';

type Dup = 'skip' | 'fail';

type Props = {
  token: boolean;
  textbookUnit: string;
  onTextbookUnit: (v: string) => void;
  dupPolicy: Dup;
  onDupPolicy: (v: Dup) => void;
  onValidate: () => void;
  validateBusy: boolean;
  canValidate: boolean;
};

export function AdminBulkKanjiPasteTools({
  token,
  textbookUnit,
  onTextbookUnit,
  dupPolicy,
  onDupPolicy,
  onValidate,
  validateBusy,
  canValidate,
}: Props) {
  return (
    <View style={styles.toolsBlock}>
      <Text style={styles.toolsLabel}>{mn.admin.bulkTextbookUnit}</Text>
      <TextInput
        style={styles.toolsInput}
        value={textbookUnit}
        onChangeText={onTextbookUnit}
        placeholder="жишээ: JLPT1-U3"
        editable={!!token}
        autoCapitalize="none"
      />
      <Text style={styles.toolsLabel}>{mn.admin.bulkDupPolicyTitle}</Text>
      <View style={styles.segRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!token}
          style={[styles.segBtn, dupPolicy === 'skip' && styles.segBtnOn]}
          onPress={() => onDupPolicy('skip')}
        >
          <Text style={styles.segTx}>{mn.admin.bulkDupSkip}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!token}
          style={[styles.segBtn, dupPolicy === 'fail' && styles.segBtnOn]}
          onPress={() => onDupPolicy('fail')}
        >
          <Text style={styles.segTx}>{mn.admin.bulkDupFail}</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!token || !canValidate || validateBusy}
        style={({ pressed }) => [
          styles.btnSec,
          (!token || !canValidate || validateBusy) && styles.btnDis,
          pressed && Platform.OS !== 'web' && { opacity: 0.92 },
        ]}
        onPress={() => onValidate()}
      >
        <Text style={styles.btnSecTx}>{validateBusy ? '…' : mn.admin.bulkServerValidate}</Text>
      </Pressable>
    </View>
  );
}
