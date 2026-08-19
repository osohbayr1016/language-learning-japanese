import 'react-native';

declare module 'react-native' {
  interface PressableStateCallbackType {
    /** Set on react-native-web when the control has keyboard focus */
    readonly focused?: boolean;
    /** Set on react-native-web while a pointer is over the control */
    readonly hovered?: boolean;
  }
}
