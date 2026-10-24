// a tab's key (the list lives in static/js/tab-registry.js)
export type RouteKey = string;

export interface DownloadState {
  stage: 'queued' | 'reading' | 'downloading' | 'processing' | 'done' | 'error';
  percent: number;
  message: string;
}

export interface SwipeItem {
  id: string;
  via?: string;     // 'phone' = shared from the phone (Track Sync · Gallery)
  viaAt?: number;
  image?: string | null;
  images?: string[];
  video?: string;
  title: string;
  source: string;
  link: string;
  response: string;
  added: number;
  waiting?: boolean;
  download?: DownloadState;
}
