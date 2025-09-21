import type { VectorDataset, DatasetSource, DatasetLayer } from './types.js';

/**
 * Create a vector dataset configuration
 */
export function makeVectorDataset(config: {
  id: string;
  name: string;
  description?: string;
  url: string;
  sourceLayer?: string;
  layers: Record<string, Omit<DatasetLayer, 'id'>>;
  attribution?: string;
  minzoom?: number;
  maxzoom?: number;
  bounds?: [number, number, number, number];
}): VectorDataset {
  const { id, name, description, url, sourceLayer, layers, attribution, minzoom, maxzoom, bounds } = config;

  // Create source properties
  const sourceProps: DatasetSource = {
    type: 'vector',
    url,
    ...(minzoom !== undefined && { minzoom }),
    ...(maxzoom !== undefined && { maxzoom }),
    ...(bounds && { bounds }),
    ...(attribution && { attribution }),
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
export { makeSsurgoDataset, makeCdlDataset, makePlssDataset } from './layers/index.js';
