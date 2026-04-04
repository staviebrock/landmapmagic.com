// landmapmagic/layers - Pure data configs for MapLibre/Mapbox style spec
// No React dependency. Works with any MapLibre or Mapbox GL JS setup.

import {
  makeVectorDataset,
  makeSsurgoDataset,
  makeCdlDataset,
  makePlssDataset,
  makeCluDataset,
  makeStatesDataset,
  makeCountiesDataset,
  makeTownshipsDataset,
  makeSectionsDataset,
  makeParcelsDataset,
  getParcelsTilesUrl,
} from './core/makeVectorDataset.js';

// Types
export type {
  VectorDataset,
  DatasetSource,
  DatasetLayer,
  ClickInfoConfig,
  ClickInfoField,
  LandDatasets,
  SsurgoDataset,
  CdlDataset,
  PlssDataset,
  CluDataset,
  StatesDataset,
  CountiesDataset,
  TownshipsDataset,
  SectionsDataset,
  ParcelsDataset,
  LngLat,
  Bounds,
} from './core/types.js';

// Layer factory functions
export {
  makeVectorDataset,
  makeSsurgoDataset,
  makeCdlDataset,
  makePlssDataset,
  makeCluDataset,
  makeStatesDataset,
  makeCountiesDataset,
  makeTownshipsDataset,
  makeSectionsDataset,
  makeParcelsDataset,
  getParcelsTilesUrl,
};

// Constants
export { DEFAULT_WORKER_ENDPOINT } from './core/utils.js';

// Zoom thresholds and layer hierarchy - useful for building your own visibility logic
export const LAYER_HIERARCHY = ['states', 'counties', 'townships', 'sections', 'clu'] as const;

export const ZOOM_THRESHOLDS: Record<string, number> = {
  states: 0,
  counties: 6,
  townships: 10,
  sections: 12,
  clu: 14,
  parcels: 14,
};

// Independent overlay layers (not part of the zoom hierarchy)
export const OVERLAY_LAYERS = ['cdl', 'ssurgo', 'parcels'] as const;

// All available layer IDs
export const ALL_LAYERS = ['states', 'counties', 'townships', 'sections', 'clu', 'cdl', 'ssurgo', 'parcels'] as const;
export type LayerId = (typeof ALL_LAYERS)[number];

/**
 * Create all datasets at once with shared config.
 * Convenience wrapper around the individual make*Dataset functions.
 */
export function createAllDatasets(options: {
  apiKey?: string;
  apiUrl?: string;
  borderColor?: string;
  cdlYear?: string;
}) {
  const { apiKey = 'dev', apiUrl, borderColor, cdlYear = '2024' } = options;
  return {
    ssurgo: makeSsurgoDataset(apiKey, apiUrl),
    cdl: makeCdlDataset(apiKey, apiUrl, cdlYear),
    plss: makePlssDataset(apiKey, apiUrl),
    clu: makeCluDataset(apiKey, apiUrl, borderColor),
    states: makeStatesDataset(apiKey, apiUrl),
    counties: makeCountiesDataset(apiKey, apiUrl),
    townships: makeTownshipsDataset(apiKey, apiUrl),
    sections: makeSectionsDataset(apiKey, apiUrl),
    parcels: makeParcelsDataset(apiKey, apiUrl),
  };
}
