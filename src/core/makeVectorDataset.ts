import type { VectorDataset, DatasetSource, DatasetLayer, SsurgoDataset, CdlDataset, PlssDataset } from './types.js';

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

/**
 * Create SSURGO soil dataset
 */
export function makeSsurgoDataset(): SsurgoDataset {
  return makeVectorDataset({
    id: 'ssurgo',
    name: 'SSURGO Soil Data',
    description: 'Soil Survey Geographic Database - detailed soil information',
    url: 'pmtiles://https://tiles.landmap.com/ssurgo.pmtiles',
    sourceLayer: 'soils',
    attribution: '© USDA NRCS',
    minzoom: 10,
    maxzoom: 16,
    layers: {
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['has', 'hydric'],
            ['case', ['get', 'hydric'], '#4A90E2', '#8FBC8F'],
            '#DEB887'
          ],
          'fill-opacity': 0.6,
          'fill-outline-color': '#8B4513'
        },
        layout: {}
      },
      outline: {
        type: 'line',
        paint: {
          'line-color': '#8B4513',
          'line-width': 1,
          'line-opacity': 0.8
        },
        layout: {}
      }
    }
  }) as SsurgoDataset;
}

/**
 * Create CDL cropland dataset
 */
export function makeCdlDataset(): CdlDataset {
  return makeVectorDataset({
    id: 'cdl',
    name: 'Cropland Data Layer',
    description: 'USDA NASS Cropland Data Layer - crop type classification',
    url: 'pmtiles://https://tiles.landmap.com/cdl.pmtiles',
    sourceLayer: 'crops',
    attribution: '© USDA NASS',
    minzoom: 8,
    maxzoom: 14,
    layers: {
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'crop_type'],
            'corn', '#FFD700',
            'soybeans', '#32CD32',
            'wheat', '#DEB887',
            'cotton', '#F5F5DC',
            'rice', '#87CEEB',
            'alfalfa', '#9ACD32',
            'other_hay', '#90EE90',
            'pasture', '#98FB98',
            'forest', '#228B22',
            'developed', '#696969',
            'water', '#4682B4',
            '#CCCCCC' // default
          ],
          'fill-opacity': 0.7
        },
        layout: {}
      }
    }
  }) as CdlDataset;
}

/**
 * Create PLSS (Public Land Survey System) dataset
 */
export function makePlssDataset(): PlssDataset {
  return makeVectorDataset({
    id: 'plss',
    name: 'Public Land Survey System',
    description: 'Township, Range, and Section boundaries',
    url: 'pmtiles://https://tiles.landmap.com/plss.pmtiles',
    sourceLayer: 'plss',
    attribution: '© Bureau of Land Management',
    minzoom: 6,
    maxzoom: 16,
    layers: {
      township: {
        type: 'line',
        paint: {
          'line-color': '#FF6B6B',
          'line-width': 2,
          'line-opacity': 0.8
        },
        layout: {},
        filter: ['==', ['get', 'type'], 'township']
      },
      section: {
        type: 'line',
        paint: {
          'line-color': '#4ECDC4',
          'line-width': 1,
          'line-opacity': 0.6
        },
        layout: {},
        filter: ['==', ['get', 'type'], 'section']
      },
      labels: {
        type: 'symbol',
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        minzoom: 12
      }
    }
  }) as PlssDataset;
}
