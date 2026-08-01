export function vibrate(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Ignore errors on devices that don't support it
    }
  }
}

export const haptics = {
  light: () => vibrate(50),
  medium: () => vibrate(100),
  heavy: () => vibrate(150),
  success: () => vibrate([50, 50, 50]),
  error: () => vibrate([50, 100, 50, 100, 50])
}
