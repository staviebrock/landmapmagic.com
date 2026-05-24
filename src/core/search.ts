import type { SearchResult } from './types.js';

export interface SearchParams {
  q: string;
  types?: string;
  limit?: number;
  region?: string;
  lat?: number;
  lng?: number;
  bbox?: string;
  center_lat?: number;
  center_lng?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  query_interpretation?: Record<string, unknown>;
  debug_timing?: Record<string, unknown>;
}

const DEFAULT_API_URL = 'https://api.landmapmagic.com';

export function buildSearchUrl(
  params: SearchParams & { apiKey: string; apiUrl?: string },
): string {
  const baseUrl = (params.apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const url = new URL(`${baseUrl}/v1/data/search`);
  url.searchParams.set('key', params.apiKey);
  url.searchParams.set('q', params.q);
  url.searchParams.set('limit', String(params.limit ?? 10));

  if (params.types) url.searchParams.set('types', params.types);
  if (params.region) url.searchParams.set('region', params.region);
  if (params.lat != null) url.searchParams.set('lat', String(params.lat));
  if (params.lng != null) url.searchParams.set('lng', String(params.lng));
  if (params.bbox) url.searchParams.set('bbox', params.bbox);
  if (params.center_lat != null) url.searchParams.set('center_lat', String(params.center_lat));
  if (params.center_lng != null) url.searchParams.set('center_lng', String(params.center_lng));

  return url.toString();
}

export async function fetchLandMapSearch(
  params: SearchParams & { apiKey: string; apiUrl?: string },
): Promise<SearchResponse> {
  const response = await fetch(buildSearchUrl(params));
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : typeof data?.message === 'string'
          ? data.message
          : `Search failed (${response.status})`;
    throw new Error(message);
  }

  return data as SearchResponse;
}
