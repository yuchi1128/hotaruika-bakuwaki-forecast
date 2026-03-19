import { API_URL } from '@/lib/constants';
import { getDeviceId } from '@/lib/deviceId';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (typeof window !== 'undefined') {
    headers.set('X-Device-ID', getDeviceId());
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}
