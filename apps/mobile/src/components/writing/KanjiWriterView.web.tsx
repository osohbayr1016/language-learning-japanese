// @ts-nocheck — DOM iframe + window; RN tsconfig lib omits DOM to avoid clashing with native-only typings.
import React, { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { buildKanjiWriterHtml } from './kanjiWriterHtml';
import type { KanjiWriterEvent, KanjiWriterHandle, KanjiWriterViewProps } from './kanjiWriterTypes';

export * from './kanjiWriterTypes';

export const KanjiWriterView = forwardRef<KanjiWriterHandle, KanjiWriterViewProps>(function KanjiWriterView(
  { char, mode, size = 280, strokeColor = colors.text.primary, outlineColor = colors.border, strokeDataJp = false, onEvent },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const htmlRef = useRef('');

  const html = useMemo(
    () => buildKanjiWriterHtml(char, mode, colors.bg.card, strokeColor, outlineColor, size, 'parent', strokeDataJp),
    [char, mode, strokeColor, outlineColor, size, strokeDataJp]
  );
  htmlRef.current = html;

  useImperativeHandle(ref, () => ({
    reset: () => {
      const el = iframeRef.current;
      if (!el) return;
      const h = htmlRef.current;
      el.srcdoc = '';
      el.srcdoc = h;
    },
  }), []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      try {
        const raw = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!raw || raw.__kanji !== 1 || !raw.payload) return;
        onEvent?.(raw.payload as KanjiWriterEvent);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onEvent]);

  return createElement(
    View,
    { style: [styles.box, { width: size, height: size }] },
    createElement('iframe', {
      ref: iframeRef,
      title: 'kanji-writer',
      srcDoc: html,
      style: { width: '100%', height: '100%', border: 'none', display: 'block' },
      sandbox: 'allow-scripts allow-same-origin',
    })
  );
});

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
