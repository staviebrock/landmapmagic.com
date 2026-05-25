/**
 * landmapmagic/leaflet
 *
 * Adapter that turns the LandMapMagic /v1/styles?target=leaflet response
 * into actual Leaflet layers. Peer-deps `leaflet` and
 * `Leaflet.VectorGrid` (e.g. `leaflet.vectorgrid`) should be supplied by
 * the caller — we type them as `any` to avoid forcing the user to install
 * them just to type-check.
 *
 * Scope: this adapter renders the baseline style verbatim. Per-feature
 * coloring (e.g. PLSS by admin_level, SSURGO by hydgrp), hover effects,
 * and divIcon-based labels are intentionally not handled here — they're
 * customization the caller wires up by overriding `vectorTileLayerStyles`
 * after `mountLeafletLandMap` returns. See the customizing-styles docs.
 */
import {
  fetchLandStyle,
  type LayerSpec,
} from '../core/styles-client.js';

export interface LeafletMountOptions {
  apiKey: string;
  apiUrl?: string;
  /** Layers to fetch, e.g. ['clu', 'cdl:2024']. */
  layers: LayerSpec[];
  /** Leaflet map instance. Required. */
  map: any;
  /**
   * Reference to the global Leaflet `L` namespace. Optional — falls back to
   * `window.L` if not provided.
   */
  L?: any;
  signal?: AbortSignal;
}

export interface LeafletMountResult {
  /** Each created Leaflet layer, in render order. */
  layers: any[];
  /** Remove all created layers from the map. */
  remove: () => void;
}

function getL(opts: LeafletMountOptions): any {
  const L = opts.L ?? (typeof window !== 'undefined' ? (window as any).L : undefined);
  if (!L) {
    throw new Error(
      'mountLeafletLandMap: Leaflet (`L`) is required. Pass `L` explicitly or include leaflet via a script tag.'
    );
  }
  return L;
}

/**
 * One-liner: fetch the leaflet style and mount it on the supplied map.
 *
 * ```ts
 * import L from 'leaflet';
 * import 'leaflet.vectorgrid';
 * import { mountLeafletLandMap } from 'landmapmagic/leaflet';
 *
 * const result = await mountLeafletLandMap({
 *   apiKey: 'lmm_live_…',
 *   layers: ['clu', 'cdl:2024'],
 *   map,
 *   L,
 * });
 * // ... later
 * result.remove();
 * ```
 */
export async function mountLeafletLandMap(
  options: LeafletMountOptions
): Promise<LeafletMountResult> {
  const { apiKey, apiUrl, layers, map, signal } = options;
  const L = getL(options);

  const style = (await fetchLandStyle({
    apiKey,
    apiUrl,
    target: 'leaflet',
    layers,
    signal,
  })) as { layers: any[] };

  const created: any[] = [];

  for (const desc of style.layers) {
    if (desc.type === 'tileLayer') {
      const layer = L.tileLayer(desc.url, desc.options || {});
      layer.addTo(map);
      created.push(layer);
      continue;
    }

    if (desc.type === 'vectorGrid') {
      const opts = desc.options || {};
      const grid = L.vectorGrid.protobuf(desc.url, {
        ...opts,
        rendererFactory: opts.rendererFactory ?? L.canvas.tile,
        vectorTileLayerStyles: desc.vectorTileLayerStyles,
        getFeatureId: (feat: any) =>
          feat?.properties?.[desc.labelIdField ?? 'lmm_label_id'] ?? feat?.id,
      });
      grid.addTo(map);
      created.push(grid);
    }
  }

  return {
    layers: created,
    remove() {
      for (const layer of created) {
        try {
          map.removeLayer(layer);
        } catch {
          // ignore
        }
      }
    },
  };
}

export default mountLeafletLandMap;
