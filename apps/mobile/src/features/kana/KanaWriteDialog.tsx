import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { KanaWriteDialogContent } from './KanaWriteDialogContent';

type Props = {
  visible: boolean;
  glyph: string;
  onClose: () => void;
};

export function KanaWriteDialog({ visible, glyph, onClose }: Props) {
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (visible) setMountKey((k) => k + 1);
  }, [visible, glyph]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />
        <View style={styles.sheet} pointerEvents="box-none">
          <KanaWriteDialogContent key={mountKey} glyph={glyph} onClose={handleClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { alignItems: 'center', justifyContent: 'center' },
});
