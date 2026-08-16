const STORAGE_KEY = "yimaru:notification-popup-enabled"

export const NOTIFICATION_POPUP_PREFERENCE_EVENT = "yimaru:notification-popup-preference"

export function getNotificationPopupEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === "true"
  } catch {
    return true
  }
}

export function setNotificationPopupEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // ignore storage failures
  }
  window.dispatchEvent(
    new CustomEvent<boolean>(NOTIFICATION_POPUP_PREFERENCE_EVENT, { detail: enabled }),
  )
}
