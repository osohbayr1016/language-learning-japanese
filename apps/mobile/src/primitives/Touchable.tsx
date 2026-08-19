import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  ViewStyle,
  type AccessibilityRole,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { interaction, motion, shadows } from '../theme';

const isWeb = Platform.OS === 'web';

/** `cursor` is a web-only style, so it has to bypass RN's ViewStyle typing. */
const disabledCursor = (isWeb ? { cursor: 'default' } : null) as ViewStyle | null;

export type HapticStrength = 'none' | 'light' | 'medium' | 'heavy' | 'success' | 'error';

/** Fire-and-forget: a missing haptics engine must never break a tap. */
export function fireHaptic(strength: HapticStrength) {
  if (strength === 'none' || isWeb) return;
  try {
    if (strength === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (strength === 'error') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      } as const;
      void Haptics.impactAsync(map[strength]);
    }
  } catch {
    /* haptics unavailable — silent */
  }
}

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** How far the surface shrinks while held. Defaults to the standard button scale. */
  scaleTo?: number;
  /** Pixels the surface rises on pointer hover (web only). 0 disables. */
  hoverLift?: number;
  /** Raise the shadow on hover. */
  hoverShadow?: boolean;
  haptic?: HapticStrength;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Merged in only while the pointer is over the surface (web). */
  hoveredStyle?: StyleProp<ViewStyle>;
  /** Merged in only while the surface is held. */
  pressedStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: React.ComponentProps<typeof Pressable>['accessibilityState'];
  testID?: string;
};

/**
 * The one tappable surface for the app.
 *
 * Every screen used to hand-roll its own `pressed` style, so identical-looking
 * tiles shrank by different amounts and several had no feedback at all. This
 * gives one press/hover/focus language: shrink on press, lift on hover, a
 * single focus ring, and haptics on native.
 *
 * Transform lives on the same node as the visual style — scaling a wrapper
 * would shrink the content while leaving the card background behind. On web the
 * shared `transitionProperty` smooths every state change for free; on native
 * the change is immediate, which is the correct feel for touch.
 */
export function Touchable({
  children,
  onPress,
  onLongPress,
  scaleTo = motion.scale.press,
  hoverLift = 2,
  hoverShadow = true,
  haptic = 'light',
  disabled = false,
  style,
  hoveredStyle,
  pressedStyle,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: Props) {
  const handlePressIn = useCallback(() => {
    if (!disabled) fireHaptic(haptic);
  }, [disabled, haptic]);

  return (
    <Pressable
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      style={({ pressed, hovered, focused }): StyleProp<ViewStyle> => {
        const active = !disabled;
        const isHovered = Boolean(hovered) && active && !pressed;
        const layers: StyleProp<ViewStyle>[] = [
          interaction.web as ViewStyle | null,
          style,
          disabled ? disabledCursor : null,
          isHovered && hoverShadow ? shadows.hover : null,
          isHovered ? hoveredStyle : null,
          pressed && active ? pressedStyle : null,
          // Transform last so it wins over any transform in `style`.
          isHovered && hoverLift ? { transform: [{ translateY: -hoverLift }] } : null,
          pressed && active ? { transform: [{ scale: scaleTo }] } : null,
          focused ? (interaction.focusRing as ViewStyle | null) : null,
        ];
        return layers;
      }}
    >
      {children}
    </Pressable>
  );
}
