import type { SwipeItem } from './types';

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, init); } catch (error) {
    if (init?.method && init.method !== 'GET') throw new Error('Call Studio did not respond (it may have just restarted). Nothing was changed by this request that I know of; try again in a few seconds.');
    await new Promise(r => setTimeout(r, 1500));   // a read can safely be retried once
    response = await fetch(url, init);
  }
  let data: unknown = null;
  try { data = await response.json(); } catch { /* non-JSON error */ }
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data ? String((data as { error: unknown }).error) : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const getSwipeItems = () => api<{ items: SwipeItem[] }>('/api/swipe');

export const downloadSwipe = (payload: { link: string } | { id: string }) => api<{ item: SwipeItem; duplicate?: boolean }>('/api/swipe-download', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});

export const updateSwipe = (item: SwipeItem, patch: Partial<Pick<SwipeItem, 'title' | 'source' | 'link' | 'response'>>) => api<{ ok: boolean }>('/api/swipe-update', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, ...patch }),
});

export const deleteSwipe = (id: string) => api<{ ok: boolean }>(`/api/swipe-delete?id=${encodeURIComponent(id)}`, { method: 'POST' });

export const uploadSwipe = (file: File) => api<{ item: SwipeItem }>('/api/swipe-add', {
  method: 'POST', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Title': encodeURIComponent(file.name.replace(/\.[^.]+$/, '')) },
});

export const imageUrl = (name: string) => `/swipe-img/${encodeURIComponent(name)}`;
export const videoUrl = (name: string) => `/swipe-video/${encodeURIComponent(name)}`;
export const swipePath = (id: string) => api<{ path: string; name: string }>(`/api/swipe-path?id=${encodeURIComponent(id)}`);
export const revealSwipe = (id: string) => api<{ ok: boolean; path: string }>(`/api/swipe-reveal?id=${encodeURIComponent(id)}`, { method: 'POST' });
