import React from 'react';
import { View } from 'react-native-web';

/**
 * Notch insets, from the CSS environment variables the browser exposes.
 * `viewport-fit=cover` in index.html is what makes env(safe-area-inset-*) real
 * on iOS Safari; elsewhere they resolve to 0.
 */
function readInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
  if (typeof window === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.height = `env(safe-area-inset-${side}, 0px)`;
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).height) || 0;
  probe.remove();
  return value;
}

export type EdgeInsets = { top: number; right: number; bottom: number; left: number };

export function useSafeAreaInsets(): EdgeInsets {
  const [insets, setInsets] = React.useState<EdgeInsets>({ top: 0, right: 0, bottom: 0, left: 0 });
  React.useEffect(() => {
    const read = () =>
      setInsets({
        top: readInset('top'),
        right: readInset('right'),
        bottom: readInset('bottom'),
        left: readInset('left'),
      });
    read();
    window.addEventListener('resize', read);
    window.addEventListener('orientationchange', read);
    return () => {
      window.removeEventListener('resize', read);
      window.removeEventListener('orientationchange', read);
    };
  }, []);
  return insets;
}

export function SafeAreaProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export function SafeAreaView({ children, style }: { children?: React.ReactNode; style?: unknown }) {
  return <View style={style as never}>{children}</View>;
}
export const initialWindowMetrics = null;
