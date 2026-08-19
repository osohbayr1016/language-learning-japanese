import React from 'react';
import { toCssStyle } from './style';

type Props = {
  source: { html?: string; uri?: string };
  style?: unknown;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  scrollEnabled?: boolean;
};

/**
 * WebView as an <iframe>. postMessage from inside the frame is forwarded to
 * onMessage so the kanji stroke renderer keeps reporting back the same way.
 */
export const WebView = React.forwardRef<HTMLIFrameElement, Props>(function WebView(
  { source, style, onMessage },
  ref
) {
  React.useEffect(() => {
    if (!onMessage) return;
    const handler = (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
      onMessage({ nativeEvent: { data } });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  return (
    <iframe
      ref={ref}
      title="embedded content"
      srcDoc={source.html}
      src={source.uri}
      sandbox="allow-scripts allow-same-origin"
      style={{ border: 0, width: '100%', height: '100%', ...toCssStyle(style) }}
    />
  );
});

export default WebView;
