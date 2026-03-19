const STORAGE_KEY = 'device_id';
const COOKIE_NAME = 'device_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10年

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(arr, v => chars[v % chars.length]).join('');
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function getDeviceId(): string {
  // localStorage → Cookie の順で既存IDを探す
  const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (fromStorage) {
    // Cookieにも同期
    setCookie(COOKIE_NAME, fromStorage);
    return fromStorage;
  }

  const fromCookie = typeof document !== 'undefined' ? getCookie(COOKIE_NAME) : null;
  if (fromCookie) {
    // localStorageにも同期
    localStorage.setItem(STORAGE_KEY, fromCookie);
    return fromCookie;
  }

  // 新規生成して両方に保存
  const id = generateId();
  localStorage.setItem(STORAGE_KEY, id);
  setCookie(COOKIE_NAME, id);
  return id;
}
