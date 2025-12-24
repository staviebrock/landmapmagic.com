import type { VectorDataset, DatasetSource, DatasetLayer } from './types.js';

/**
 * Create a vector dataset configuration
 * Uses MVT tiles (array of tile URL templates)
 */
export function makeVectorDataset(config: {
  id: string;
  name: string;
  description?: string;
  url?: string;           // Single URL for vector source (legacy)
  tiles?: string[];       // MVT tile URL templates (preferred)
  sourceLayer?: string;
  layers: Record<string, Omit<DatasetLayer, 'id'>>;
  attribution?: string;
  minzoom?: number;
  maxzoom?: number;
  bounds?: [number, number, number, number];
  promoteId?: string | Record<string, string>;
}): VectorDataset {
  const { id, name, description, url, tiles, sourceLayer, layers, attribution, minzoom, maxzoom, bounds, promoteId } = config;

  // Create source properties - prefer tiles over url
  const sourceProps: DatasetSource = {
    type: 'vector',
    ...(tiles ? { tiles } : { url }),
    ...(minzoom !== undefined && { minzoom }),
    ...(maxzoom !== undefined && { maxzoom }),
    ...(bounds && { bounds }),
    ...(attribution && { attribution }),
    ...(promoteId && { promoteId }),
  };

  // Create layer configurations with proper IDs and source-layer
  const processedLayers: Record<string, DatasetLayer> = {};
  
  Object.entries(layers).forEach(([layerKey, layerConfig]) => {
    processedLayers[layerKey] = {
      ...layerConfig,
      id: `${id}-${layerKey}`,
      ...(sourceLayer && { 'source-layer': sourceLayer }),
    } as DatasetLayer;
  });

  return {
    id,
    name,
    description,
    sourceProps,
    layers: processedLayers,
    attribution,
  };
}

// Re-export the dataset creation functions from the layers folder
export { makeSsurgoDataset, makeCdlDataset, makePlssDataset, makeCluDataset, makeStatesDataset, makeCountiesDataset, makeTownshipsDataset, makeSectionsDataset } from './layers/index.js';
