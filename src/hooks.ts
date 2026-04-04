// landmapmagic/hooks - React hooks for integrating LandMapMagic layers
// into your existing MapLibre GL JS map.
//
// These hooks take a map instance ref and manage the full lifecycle:
// adding/removing sources and layers, visibility, zoom-based hierarchy,
// hover states, and click info.

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type {
  VectorDataset,
  ClickInfoConfig,
} from './core/types.js';
import { createAllDatasets, LAYER_HIERARCHY, ZOOM_THRESHOLDS, OVERLAY_LAYERS } from './layers.js';
import type { LayerId } from './layers.js';

// Re-export layers + style for convenience
export { createAllDatasets, LAYER_HIERARCHY, ZOOM_THRESHOLDS, OVERLAY_LAYERS, ALL_LAYERS } from './layers.js';
export type { LayerId } from './layers.js';
export type { VectorDataset, DatasetLayer, DatasetSource, ClickInfoConfig } from './core/types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Any object that looks like a MapLibre/Mapbox GL JS Map instance. */
export interface MapInstance {
  getSource(id: string): any;
  addSource(id: string, source: any): void;
  removeSource(id: string): void;
  getLayer(id: string): any;
  addLayer(layer: any): void;
  removeLayer(id: string): void;
  setLayoutProperty(layerId: string, name: string, value: any): void;
  getLayoutProperty(layerId: string, name: string): any;
  setFeatureState(target: any, state: any): void;
  removeFeatureState(target: any): void;
  queryRenderedFeatures(point: any, options?: any): any[];
  on(type: string, layerOrCallback: any, callback?: any): void;
  off(type: string, layerOrCallback: any, callback?: any): void;
  getZoom(): number;
  getCanvas(): HTMLCanvasElement;
  isStyleLoaded(): boolean;
  once(type: string, callback: any): void;
}

export interface UseLandMapLayersOptions {
  apiKey?: string;
  apiUrl?: string;
  borderColor?: string;
  cdlYear?: string;
  /** Which layers to make available. Defaults to all. */
  layers?: LayerId[];
  /** Which layers to show initially. Defaults to none. */
  initialVisible?: LayerId[];
  /** Enable hover highlighting via feature-state. Default true. */
  hover?: boolean;
}

export interface ClickInfoEvent {
  point: { x: number; y: number };
  lngLat: { lng: number; lat: number };
  properties: Record<string, any>;
  config: ClickInfoConfig;
  layerId: string;
  datasetId: string;
}

export interface UseLandMapLayersReturn {
  /** Currently visible layer IDs. */
  visibleLayers: LayerId[];
  /** Toggle a layer on/off. */
  toggleLayer: (id: LayerId) => void;
  /** Set visible layers explicitly. */
  setVisibleLayers: (ids: LayerId[]) => void;
  /** All available dataset objects, keyed by ID. */
  datasets: Record<string, VectorDataset>;
  /** Current zoom-based main layer. */
  mainLayer: string | null;
  /** Current zoom-based parent layer. */
  parentLayer: string | null;
  /** Whether the hook has finished adding sources/layers to the map. */
  ready: boolean;
  /** Current CDL year. */
  cdlYear: string;
  /** Change the CDL year (triggers source swap). */
  setCdlYear: (year: string) => void;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getVisibleHierarchy(
  zoom: number,
  enabledLayers: string[],
): { main: string | null; parent: string | null } {
  let main: string | null = null;
  let parent: string | null = null;

  for (let i = LAYER_HIERARCHY.length - 1; i >= 0; i--) {
    const layer = LAYER_HIERARCHY[i];
    if (enabledLayers.includes(layer) && zoom >= ZOOM_THRESHOLDS[layer]) {
      main = layer;
      for (let j = i - 1; j >= 0; j--) {
        if (enabledLayers.includes(LAYER_HIERARCHY[j])) {
          parent = LAYER_HIERARCHY[j];
          break;
        }
      }
      break;
    }
  }

  if (!main && enabledLayers.length > 0) {
    for (const layer of LAYER_HIERARCHY) {
      if (enabledLayers.includes(layer)) {
        main = layer;
        break;
      }
    }
  }

  return { main, parent };
}

function safeSetVisibility(map: MapInstance, layerId: string, visible: boolean) {
  try {
    if (map.getLayer(layerId)) {
      const value = visible ? 'visible' : 'none';
      if (map.getLayoutProperty(layerId, 'visibility') !== value) {
        map.setLayoutProperty(layerId, 'visibility', value);
      }
    }
  } catch {
    // layer may have been removed
  }
}

// --------------------------------------------------------------------------
// useLandMapLayers
// --------------------------------------------------------------------------

/**
 * Hook that adds LandMapMagic layers to an existing MapLibre GL JS map instance.
 *
 * Manages the full lifecycle: sources, layers, zoom-based hierarchy,
 * visibility toggling, hover states, and CDL year switching.
 *
 * ```tsx
 * const mapRef = useRef<maplibregl.Map>(null);
 * const land = useLandMapLayers(mapRef, {
 *   apiKey: 'xxx',
 *   layers: ['clu', 'cdl', 'parcels'],
 *   initialVisible: ['clu'],
 * });
 * ```
 */
export function useLandMapLayers(
  mapRef: React.RefObject<MapInstance | null>,
  options: UseLandMapLayersOptions = {},
): UseLandMapLayersReturn {
  const {
    apiKey = 'dev',
    apiUrl,
    borderColor,
    cdlYear: initialCdlYear = '2024',
    layers: requestedLayers,
    initialVisible = [],
    hover = true,
  } = options;

  const [visibleLayers, setVisibleLayers] = useState<LayerId[]>(initialVisible);
  const [cdlYear, setCdlYear] = useState(initialCdlYear);
  const [mainLayer, setMainLayer] = useState<string | null>(null);
  const [parentLayer, setParentLayer] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const sourcesAdded = useRef(new Set<string>());
  const layersAdded = useRef(new Set<string>());
  const hoverState = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const cleanupFns = useRef<Array<() => void>>([]);

  // Available layer set
  const availableSet = useMemo(
    () => new Set(requestedLayers ?? (['states', 'counties', 'townships', 'sections', 'clu', 'cdl', 'ssurgo', 'parcels'] as LayerId[])),
    [requestedLayers],
  );

  // Build datasets (pure data, no side effects)
  const datasets = useMemo(
    () => createAllDatasets({ apiKey, apiUrl, borderColor, cdlYear }),
    [apiKey, apiUrl, borderColor, cdlYear],
  );

  // Filtered datasets based on requested layers
  const activeDatasets = useMemo(() => {
    const result: Record<string, VectorDataset> = {};
    for (const [key, ds] of Object.entries(datasets)) {
      if (availableSet.has(key as LayerId)) {
        result[key] = ds;
      }
    }
    return result;
  }, [datasets, availableSet]);

  // Toggle helper
  const toggleLayer = useCallback((id: LayerId) => {
    setVisibleLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id],
    );
  }, []);

  // ---- Visibility updater ----
  const updateVisibility = useCallback(
    (map: MapInstance, zoom: number, enabled: string[]) => {
      const hierarchy = getVisibleHierarchy(zoom, enabled);
      setMainLayer(hierarchy.main);
      setParentLayer(hierarchy.parent);

      // Hierarchy layers
      for (const layerKey of LAYER_HIERARCHY) {
        const ds = activeDatasets[layerKey];
        if (!ds) continue;
        const shouldShow = layerKey === hierarchy.main || layerKey === hierarchy.parent;
        for (const sublayerKey of Object.keys(ds.layers)) {
          safeSetVisibility(map, `${ds.id}-${sublayerKey}`, shouldShow);
        }
      }

      // Overlay layers (CDL, SSURGO, Parcels) - independent of hierarchy
      for (const overlayKey of OVERLAY_LAYERS) {
        const ds = activeDatasets[overlayKey];
        if (!ds) continue;
        const isEnabled = enabled.includes(overlayKey);
        const meetsZoom = overlayKey === 'parcels' ? zoom >= ZOOM_THRESHOLDS['parcels'] : true;
        for (const sublayerKey of Object.keys(ds.layers)) {
          safeSetVisibility(map, `${ds.id}-${sublayerKey}`, isEnabled && meetsZoom);
        }
      }
    },
    [activeDatasets],
  );

  // ---- Add sources & layers to map ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const attach = () => {
      for (const [, dataset] of Object.entries(activeDatasets)) {
        // Add source
        if (!map.getSource(dataset.id)) {
          try {
            map.addSource(dataset.id, dataset.sourceProps as any);
            sourcesAdded.current.add(dataset.id);
          } catch (e) {
            console.warn(`[landmapmagic] Failed to add source ${dataset.id}:`, e);
          }
        }

        // Add layers
        for (const [layerKey, layerConfig] of Object.entries(dataset.layers)) {
          const layerId = `${dataset.id}-${layerKey}`;
          if (!map.getLayer(layerId)) {
            try {
              map.addLayer({
                ...layerConfig,
                id: layerId,
                source: dataset.id,
                layout: {
                  ...layerConfig.layout,
                  visibility: 'none', // start hidden, updateVisibility will fix
                },
              } as any);
              layersAdded.current.add(layerId);

              // Hover handlers
              if (hover && (layerKey === 'fill' || layerKey === 'outline')) {
                const onMove = (e: any) => {
                  if (!e.features?.length) return;
                  const f = e.features[0];
                  if (f.id == null) return;

                  if (
                    !hoverState.current ||
                    hoverState.current.id !== f.id ||
                    hoverState.current.source !== f.source
                  ) {
                    // Clear previous
                    if (hoverState.current) {
                      try {
                        map.setFeatureState(
                          { source: hoverState.current.source, sourceLayer: hoverState.current.sourceLayer, id: hoverState.current.id },
                          { hover: false },
                        );
                      } catch { /* noop */ }
                    }
                    try {
                      map.setFeatureState(
                        { source: f.source, sourceLayer: f.sourceLayer, id: f.id },
                        { hover: true },
                      );
                      hoverState.current = { source: f.source, sourceLayer: f.sourceLayer, id: f.id };
                    } catch { /* noop */ }
                  }
                  map.getCanvas().style.cursor = 'pointer';
                };

                const onLeave = () => {
                  if (hoverState.current) {
                    try {
                      map.setFeatureState(
                        { source: hoverState.current.source, sourceLayer: hoverState.current.sourceLayer, id: hoverState.current.id },
                        { hover: false },
                      );
                    } catch { /* noop */ }
                    hoverState.current = null;
                  }
                  map.getCanvas().style.cursor = '';
                };

                map.on('mousemove', layerId, onMove);
                map.on('mouseleave', layerId, onLeave);
                cleanupFns.current.push(() => {
                  map.off('mousemove', layerId, onMove);
                  map.off('mouseleave', layerId, onLeave);
                });
              }
            } catch (e) {
              console.warn(`[landmapmagic] Failed to add layer ${layerId}:`, e);
            }
          }
        }
      }

      // Zoom listener
      const onZoom = () => {
        updateVisibility(map, map.getZoom(), visibleLayers as string[]);
      };
      map.on('zoom', onZoom);
      cleanupFns.current.push(() => map.off('zoom', onZoom));

      // Initial visibility
      updateVisibility(map, map.getZoom(), visibleLayers as string[]);
      setReady(true);
    };

    // Wait for style to be loaded
    if (map.isStyleLoaded()) {
      attach();
    } else {
      map.once('load', attach);
    }

    return () => {
      // Run all cleanup functions
      for (const fn of cleanupFns.current) {
        try { fn(); } catch { /* noop */ }
      }
      cleanupFns.current = [];

      // Remove layers and sources we added
      const map = mapRef.current;
      if (!map) return;

      for (const layerId of layersAdded.current) {
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        } catch { /* noop */ }
      }
      for (const sourceId of sourcesAdded.current) {
        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch { /* noop */ }
      }

      layersAdded.current.clear();
      sourcesAdded.current.clear();
      setReady(false);
    };
  }, [activeDatasets]); // re-run when datasets change (e.g. CDL year)

  // ---- Update visibility when visible layers change ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    updateVisibility(map, map.getZoom(), visibleLayers as string[]);
  }, [visibleLayers, ready, updateVisibility]);

  return {
    visibleLayers,
    toggleLayer,
    setVisibleLayers,
    datasets: activeDatasets,
    mainLayer,
    parentLayer,
    ready,
    cdlYear,
    setCdlYear,
  };
}

// --------------------------------------------------------------------------
// useLandMapClick
// --------------------------------------------------------------------------

export interface UseLandMapClickOptions {
  /** The datasets object from useLandMapLayers. */
  datasets: Record<string, VectorDataset>;
  /** Currently visible layers (from useLandMapLayers). */
  visibleLayers: LayerId[];
  /** Callback when a feature is clicked. */
  onClickInfo?: (info: ClickInfoEvent | null) => void;
  /** Disable click handling. Default false. */
  disabled?: boolean;
}

/**
 * Hook that adds click-to-inspect behavior on LandMapMagic layers.
 *
 * ```tsx
 * const [clickInfo, setClickInfo] = useState(null);
 * useLandMapClick(mapRef, {
 *   datasets: land.datasets,
 *   visibleLayers: land.visibleLayers,
 *   onClickInfo: setClickInfo,
 * });
 * ```
 */
export function useLandMapClick(
  mapRef: React.RefObject<MapInstance | null>,
  options: UseLandMapClickOptions,
) {
  const { datasets, visibleLayers, onClickInfo, disabled = false } = options;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || disabled || !onClickInfo) return;

    const handleClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point);

      for (const feature of features) {
        const layerId = feature.layer.id;

        for (const [datasetKey, dataset] of Object.entries(datasets)) {
          if (
            dataset.clickInfoConfig?.layerIds?.includes(layerId) &&
            visibleLayers.includes(datasetKey as LayerId)
          ) {
            onClickInfo({
              point: { x: e.point.x, y: e.point.y },
              lngLat: e.lngLat,
              properties: feature.properties,
              config: dataset.clickInfoConfig,
              layerId,
              datasetId: datasetKey,
            });
            return;
          }
        }
      }

      // Clicked empty space
      onClickInfo(null);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapRef, datasets, visibleLayers, onClickInfo, disabled]);
}
