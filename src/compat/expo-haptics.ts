/**
 * Haptics via the Vibration API, which is the closest a browser gets.
 * Absent on desktop and on iOS Safari, so every call is best-effort.
 */
export enum ImpactFeedbackStyle { Light = 'light', Medium = 'medium', Heavy = 'heavy' }
export enum NotificationFeedbackType { Success = 'success', Warning = 'warning', Error = 'error' }

function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — a tap must never fail over feedback */
  }
}

export async function impactAsync(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium) {
  buzz(style === ImpactFeedbackStyle.Light ? 8 : style === ImpactFeedbackStyle.Heavy ? 30 : 14);
}
export async function notificationAsync(type: NotificationFeedbackType = NotificationFeedbackType.Success) {
  buzz(type === NotificationFeedbackType.Error ? [12, 60, 12] : [10, 40, 10]);
}
export async function selectionAsync() {
  buzz(6);
}
