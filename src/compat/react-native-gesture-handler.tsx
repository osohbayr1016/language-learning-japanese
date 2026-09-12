import React from 'react';
import { View, type ViewProps } from 'react-native-web';

/** The browser handles gestures natively; the root just needs to be a box. */
export function GestureHandlerRootView({ children, ...rest }: ViewProps & { children?: React.ReactNode }) {
  return <View {...rest}>{children}</View>;
}
export const Gesture = {};
export const GestureDetector = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export default { GestureHandlerRootView };
