// landmapmagic/style - MapLibre/Mapbox Style Spec helpers
//
// Now remote-first: delegates to fetchLandStyle so all aesthetic decisions
// (colors, label layouts, hover behavior) live on the styles API.
// Customization is a client-side concern after fetch — see the
// "Customizing Styles" docs for recipes.

import {
  fetchLandMapStyle,
  type LayerSpec,
  type MapLibreStyleDoc,
} from './core/styles-client.js';
import type { LayerId } from './layers.js';

export type { LayerId } from './layers.js';
export {
  fetchLandStyle,
  fetchLandMapStyle,
  clearLandStyleCache,
  type LayerSpec,
  type MapLibreStyleDoc,
  type LeafletStyleDoc,
  type GoogleStyleDoc,
  type TargetStyle,
  type StyleTarget,
  type FetchLandStyleOptions,
} from './core/styles-client.js';

/** @deprecated Use {@link MapLibreStyleDoc} from './core/styles-client.js' instead. */
export interface LandMapStyle {
  sources: Record<string, any>;
  layers: any[];
}

export interface GetLandMapStyleOptions {
  apiKey: string;
  apiUrl?: string;
  /** Layers to include (e.g. ['clu', 'cdl:2024']). Defaults to ['clu']. */
  layers?: LayerSpec[];
  /**
   * @deprecated CDL years are now expressed in `layers` as `cdl:YYYY`. Pass
   * `layers: ['cdl:2024']` instead. Ignored if `layers` is provided.
   */
  cdlYear?: string;
  /**
   * @deprecated `borderColor` is no longer accepted by the styles API. The
   * server ships a single good baseline; mutate the returned doc client-side
   * to recolor. See the "Customizing Styles" docs.
   */
  borderColor?: string;
  /**
   * @deprecated visibility was previously baked into the style. Toggle
   * `layout.visibility` on the returned layers yourself. Kept here so old
   * call sites still type-check; it is silently ignored.
   */
  visibleLayers?: LayerId[];
  signal?: AbortSignal;
}

/**
 * Fetch a MapLibre/Mapbox Style Spec v8 document for the requested layers.
 *
 * ```ts
 * const style = await getLandMapStyle({
 *   apiKey: 'lmm_live_…',
 *   layers: ['clu', 'cdl:2024'],
 * });
 * map.setStyle(style);
 * ```
 */
export async function getLandMapStyle(
  options: GetLandMapStyleOptions
): Promise<MapLibreStyleDoc> {
  const { apiKey, apiUrl, layers, cdlYear, signal } = options;

  // Fall back to a sensible default if the caller forgets `layers`.
  const resolved: LayerSpec[] =
    layers && layers.length > 0
      ? layers
      : cdlYear
        ? ['clu', `cdl:${Number(cdlYear)}` as LayerSpec]
        : ['clu'];

  return fetchLandMapStyle({ apiKey, apiUrl, layers: resolved, signal });
}

/**
 * Merge a LandMapMagic style into an existing style document. Non-destructive.
 *
 * ```ts
 * const land = await getLandMapStyle({ apiKey, layers: ['clu'] });
 * const merged = mergeLandMapStyle(myMapStyle, land);
 * map.setStyle(merged);
 * ```
 */
export function mergeLandMapStyle(
  existingStyle: Record<string, any>,
  landStyle: { sources?: Record<string, any>; layers?: any[] }
): Record<string, any> {
  return {
    ...existingStyle,
    sources: {
      ...(existingStyle.sources || {}),
      ...(landStyle.sources || {}),
    },
    layers: [
      ...(existingStyle.layers || []),
      ...(landStyle.layers || []),
    ],
  };
}

// Re-export useful constants for convenience.
export { LAYER_HIERARCHY, ZOOM_THRESHOLDS, OVERLAY_LAYERS, ALL_LAYERS } from './layers.js';
export type { VectorDataset, ClickInfoConfig } from './core/types.js';

