import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, radius } from '../../theme';
import { buildKanjiWriterHtml } from './kanjiWriterHtml';
import type { KanjiWriterEvent, KanjiWriterHandle, KanjiWriterViewProps } from './kanjiWriterTypes';

export * from './kanjiWriterTypes';

export const KanjiWriterView = forwardRef<KanjiWriterHandle, KanjiWriterViewProps>(function KanjiWriterView(
  { char, mode, size = 280, strokeColor = colors.text.primary, outlineColor = colors.border, strokeDataJp = false, onEvent },
  ref
) {
  const wvRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    reset: () => wvRef.current?.reload(),
  }), []);

  const html = useMemo(
    () => buildKanjiWriterHtml(char, mode, colors.bg.card, strokeColor, outlineColor, size, 'rn', strokeDataJp),
    [char, mode, strokeColor, outlineColor, size, strokeDataJp]
  );

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as KanjiWriterEvent;
      onEvent?.(msg);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <WebView
        ref={wvRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.wv}
        scrollEnabled={false}
        onMessage={onMessage}
        javaScriptEnabled
        androidLayerType="hardware"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  wv: { flex: 1, backgroundColor: 'transparent' },
});
