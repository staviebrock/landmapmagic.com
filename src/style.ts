// landmapmagic/style - MapLibre/Mapbox Style Spec JSON helpers
// Returns source and layer objects you can merge into any existing map style.
// No React dependency. No runtime dependency. Pure style spec JSON.

import type { DatasetSource, DatasetLayer } from './core/types.js';
import { createAllDatasets } from './layers.js';
import type { LayerId } from './layers.js';

export type { LayerId } from './layers.js';

export interface LandMapStyleSources {
  [sourceId: string]: DatasetSource;
}

export interface LandMapStyleLayer {
  id: string;
  source: string;
  type: string;
  'source-layer'?: string;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
  minzoom?: number;
  maxzoom?: number;
}

export interface LandMapStyle {
  sources: LandMapStyleSources;
  layers: LandMapStyleLayer[];
}

export interface GetLandMapStyleOptions {
  apiKey?: string;
  apiUrl?: string;
  borderColor?: string;
  cdlYear?: string;
  /** Which layers to include. Defaults to all. */
  layers?: LayerId[];
  /** Which layers should start visible. Defaults to none (all start hidden). */
  visibleLayers?: LayerId[];
}

/**
 * Get MapLibre/Mapbox style spec sources and layers for LandMapMagic data.
 *
 * Returns a { sources, layers } object that can be merged into any existing style:
 *
 * ```ts
 * const land = getLandMapStyle({ apiKey: 'xxx', layers: ['clu', 'parcels'] });
 * const myStyle = {
 *   ...existingStyle,
 *   sources: { ...existingStyle.sources, ...land.sources },
 *   layers: [...existingStyle.layers, ...land.layers],
 * };
 * ```
 */
export function getLandMapStyle(options: GetLandMapStyleOptions = {}): LandMapStyle {
  const {
    apiKey,
    apiUrl,
    borderColor,
    cdlYear,
    layers: requestedLayers,
    visibleLayers = [],
  } = options;

  const allDatasets = createAllDatasets({ apiKey, apiUrl, borderColor, cdlYear });

  const sources: LandMapStyleSources = {};
  const styleLayers: LandMapStyleLayer[] = [];

  const layerFilter = requestedLayers
    ? new Set(requestedLayers)
    : new Set(Object.keys(allDatasets));

  for (const [datasetKey, dataset] of Object.entries(allDatasets)) {
    if (!layerFilter.has(datasetKey as LayerId)) continue;

    // Add source
    sources[dataset.id] = dataset.sourceProps;

    // Add layers
    const isVisible = visibleLayers.includes(datasetKey as LayerId);

    const datasetLayers = dataset.layers as Record<string, DatasetLayer>;
    for (const [layerKey, layerConfig] of Object.entries(datasetLayers)) {
      const layerId = `${dataset.id}-${layerKey}`;

      const styleLayer: LandMapStyleLayer = {
        id: layerId,
        source: dataset.id,
        type: layerConfig.type,
        layout: {
          ...layerConfig.layout,
          visibility: isVisible ? 'visible' : 'none',
        },
      };

      if (layerConfig['source-layer']) {
        styleLayer['source-layer'] = layerConfig['source-layer'];
      }
      if (layerConfig.paint) {
        styleLayer.paint = layerConfig.paint;
      }
      if (layerConfig.filter) {
        styleLayer.filter = layerConfig.filter;
      }
      if (layerConfig.minzoom !== undefined) {
        styleLayer.minzoom = layerConfig.minzoom;
      }
      if (layerConfig.maxzoom !== undefined) {
        styleLayer.maxzoom = layerConfig.maxzoom;
      }

      styleLayers.push(styleLayer);
    }
  }

  return { sources, layers: styleLayers };
}

/**
 * Merge LandMapMagic style into an existing MapLibre/Mapbox style object.
 * Non-destructive - creates a new style object.
 */
export function mergeLandMapStyle(
  existingStyle: Record<string, any>,
  landStyle: LandMapStyle,
): Record<string, any> {
  return {
    ...existingStyle,
    sources: {
      ...(existingStyle.sources || {}),
      ...landStyle.sources,
    },
    layers: [
      ...(existingStyle.layers || []),
      ...landStyle.layers,
    ],
  };
}

// Re-export useful constants for convenience
export { LAYER_HIERARCHY, ZOOM_THRESHOLDS, OVERLAY_LAYERS, ALL_LAYERS } from './layers.js';
export type { VectorDataset, ClickInfoConfig } from './core/types.js';
