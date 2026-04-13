export type DefaultView = 'board' | 'list';

const KEYS = {
  defaultView: 'tf-default-view',
  notifications: 'tf-notifications',
  avatarColor: 'tf-avatar-color',
} as const;

function safeGet(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  } catch {}
}

export const preferences = {
  getDefaultView: (): DefaultView => {
    const saved = safeGet(KEYS.defaultView);
    return saved === 'list' ? 'list' : 'board';
  },
  setDefaultView: (view: DefaultView): void => {
    safeSet(KEYS.defaultView, view);
  },

  getNotifications: (): boolean => {
    return safeGet(KEYS.notifications) !== 'false';
  },
  setNotifications: (enabled: boolean): void => {
    safeSet(KEYS.notifications, String(enabled));
  },

  getAvatarColor: (): string => {
    return safeGet(KEYS.avatarColor) ?? 'var(--primary)';
  },
  setAvatarColor: (color: string): void => {
    safeSet(KEYS.avatarColor, color);
  },
};
