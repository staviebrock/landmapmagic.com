/**
 * landmapmagic styles client
 *
 * Remote-first style fetcher. Talks to /v1/styles on the LandMapMagic
 * tile-worker and returns a renderer-ready document for the requested target.
 *
 * The core package exports `target='maplibre'` (most common). The
 * `landmapmagic/leaflet` and `landmapmagic/google` subpaths consume the
 * other targets.
 */
import { DEFAULT_WORKER_ENDPOINT } from './utils.js';
import type { LayerId } from '../layers.js';

/**
 * Renderer target accepted on the wire.
 *
 * `mapbox` is an alias for `maplibre` — Mapbox GL JS consumes a MapLibre
 * Style Spec v8 doc as-is. The API serves the same payload either way; the
 * alias exists purely so callers can express intent in their own vocabulary.
 */
export type StyleTarget = 'maplibre' | 'mapbox' | 'leaflet' | 'google';

/** Layer spec accepted by /v1/styles. CDL years repeat: 'cdl:2024', 'cdl:2023'. */
export type LayerSpec = LayerId | `cdl:${number}` | (string & {});

export interface FetchLandStyleOptions {
  apiKey: string;
  apiUrl?: string;
  target?: StyleTarget;
  layers: LayerSpec[];
  signal?: AbortSignal;
}

/** MapLibre Style Spec v8 doc as returned by the API. */
export interface MapLibreStyleDoc {
  version: 8;
  name?: string;
  metadata?: Record<string, any>;
  glyphs?: string;
  sources: Record<string, any>;
  layers: any[];
}

export interface LeafletStyleDoc {
  version: 1;
  name?: string;
  layers: any[];
}

export interface GoogleStyleDoc {
  version: 1;
  name?: string;
  overlays: any[];
}

export type TargetStyle = MapLibreStyleDoc | LeafletStyleDoc | GoogleStyleDoc;

/** Cache key by (apiUrl, target, normalized layers). */
const cache = new Map<string, TargetStyle>();

function normalizeLayers(layers: readonly LayerSpec[]): string {
  return [...layers].map((s) => String(s).trim().toLowerCase()).sort().join(',');
}

/**
 * Fetch a renderer-ready style from /v1/styles.
 *
 * Caches by (apiUrl, target, normalized layers) for the session so repeat
 * calls in the same page don't re-hit the network.
 */
export async function fetchLandStyle(
  options: FetchLandStyleOptions
): Promise<TargetStyle> {
  const {
    apiKey,
    apiUrl = DEFAULT_WORKER_ENDPOINT,
    target = 'maplibre',
    layers,
    signal,
  } = options;

  if (!apiKey) {
    throw new Error('fetchLandStyle: apiKey is required.');
  }
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new Error('fetchLandStyle: layers must be a non-empty array.');
  }

  // `mapbox` is an alias for `maplibre`; share a cache slot so the same
  // session doesn't refetch the same payload under two names.
  const canonicalTarget: StyleTarget =
    target === 'mapbox' ? 'maplibre' : target;
  const cacheKey = `${apiUrl}::${canonicalTarget}::${normalizeLayers(layers)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    target,
    layers: layers.join(','),
    key: apiKey,
  });
  const url = `${apiUrl.replace(/\/$/, '')}/v1/styles?${params.toString()}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body?.error ? `: ${body.error}` : '';
    } catch {
      // ignore parse errors
    }
    throw new Error(`fetchLandStyle: HTTP ${res.status}${detail}`);
  }

  const json = (await res.json()) as TargetStyle;
  cache.set(cacheKey, json);
  return json;
}

/**
 * Convenience: fetch a MapLibre Style Spec v8 doc.
 *
 * Defaults to `target=maplibre`. Pass `target: 'mapbox'` if you want the
 * request URL to read `mapbox` (response is identical — Mapbox GL JS
 * consumes the same document).
 */
export async function fetchLandMapStyle(
  options: Omit<FetchLandStyleOptions, 'target'> & {
    target?: 'maplibre' | 'mapbox';
  }
): Promise<MapLibreStyleDoc> {
  const target = options.target ?? 'maplibre';
  const style = await fetchLandStyle({ ...options, target });
  if ((style as any)?.version !== 8) {
    throw new Error('fetchLandMapStyle: server returned a non-MapLibre style.');
  }
  return style as MapLibreStyleDoc;
}

/** Clear the in-memory style cache. Mostly useful in tests. */
export function clearLandStyleCache(): void {
  cache.clear();
}
