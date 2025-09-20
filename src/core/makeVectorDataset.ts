import type { VectorDataset, DatasetSource, DatasetLayer, SsurgoDataset, CdlDataset, PlssDataset } from './types.js';

// Default worker endpoint from environment or fallback
const getDefaultWorkerEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_WORKER_ENDPOINT || 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

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
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/ssurgo.pmtiles?key=dev`,
    sourceLayer: 'soils',
    attribution: '© USDA NRCS',
    minzoom: 4,
    maxzoom: 16,
    layers: {
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'hydgrp'], 'A'], '#2E8B57', // SeaGreen for A (well drained)
            ['==', ['get', 'hydgrp'], 'B'], '#FFD700', // Gold for B (moderately well drained)
            ['==', ['get', 'hydgrp'], 'C'], '#FF8C00', // DarkOrange for C (somewhat poorly drained)
            ['==', ['get', 'hydgrp'], 'D'], '#DC143C', // Crimson for D (poorly drained)
            // Dual groups (undrained/drained conditions)
            ['any',
              ['==', ['get', 'hydgrp'], 'A/D'],
              ['==', ['get', 'hydgrp'], 'D/A']
            ], '#8B4513', // Brown for A/D (D unless drained, then A)
            ['any',
              ['==', ['get', 'hydgrp'], 'B/D'],
              ['==', ['get', 'hydgrp'], 'D/B']
            ], '#CD853F', // Peru for B/D (D unless drained, then B)
            ['any',
              ['==', ['get', 'hydgrp'], 'C/D'],
              ['==', ['get', 'hydgrp'], 'D/C']
            ], '#D2691E', // Chocolate for C/D (D unless drained, then C)
            // Less common dual groups
            ['any',
              ['==', ['get', 'hydgrp'], 'A/B'],
              ['==', ['get', 'hydgrp'], 'B/A']
            ], '#32CD32', // LimeGreen for A/B (B unless drained, then A)
            ['any',
              ['==', ['get', 'hydgrp'], 'B/C'],
              ['==', ['get', 'hydgrp'], 'C/B']
            ], '#FFA500', // Orange for B/C (C unless drained, then B)
            // Unknown or other
            '#808080' // Gray for unknown
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.4,   // Transparent at world scale
            6, 0.6,   // Medium at country scale
            10, 0.7,  // Good at state scale
            14, 0.8   // Full at field scale
          ]
        },
        layout: {}
      },
      outline: {
        type: 'line',
        paint: {
          'line-color': '#333333',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 0,      // No lines at zoom 6 and below
            10, 0.1,   // Very thin lines at zoom 10
            12, 0.3,   // Slightly thicker at zoom 12
            14, 0.5    // Full thickness at zoom 14+
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 0,      // Invisible at zoom 6 and below
            8, 0.1,    // Very faint at zoom 8
            10, 0.3,   // More visible at zoom 10
            12, 0.6,   // Good visibility at zoom 12
            14, 0.8    // Full opacity at zoom 14+
          ]
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
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/cdl.pmtiles?key=dev`,
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
 * Matches the hierarchical structure from the working frontend prototype
 */
export function makePlssDataset(): PlssDataset {
  return makeVectorDataset({
    id: 'plss',
    name: 'Public Land Survey System',
    description: 'Hierarchical PLSS data with states, counties, townships, and sections',
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/plss.pmtiles?key=dev`,
    sourceLayer: 'plss',
    attribution: '© Bureau of Land Management',
    minzoom: 0,
    maxzoom: 16,
    layers: {
      // Hierarchical fill layer with different colors for each admin level
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], '#4A90E2',      // Blue for states
            ['==', ['get', 'admin_level'], 'county'], '#FFA500',     // Orange for counties
            ['==', ['get', 'admin_level'], 'township'], '#228B22',   // Green for townships
            ['==', ['get', 'admin_level'], 'section'], '#DC143C',    // Red for sections
            '#808080' // Gray for unknown
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.1,   // Very transparent at world scale
            4, 0.2,   // Light at country scale
            8, 0.4,   // Medium at state scale
            12, 0.6   // More visible at detailed scale
          ]
        },
        layout: {}
      },
      // Hierarchical outline layer with different colors and widths
      outline: {
        type: 'line',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], '#2E5BBA',      // Dark blue for states
            ['==', ['get', 'admin_level'], 'county'], '#CC7A00',     // Dark orange for counties
            ['==', ['get', 'admin_level'], 'township'], '#1A5F1A',   // Dark green for townships
            ['==', ['get', 'admin_level'], 'section'], '#A01030',    // Dark red for sections
            '#404040' // Dark gray for unknown
          ],
          'line-width': [
            'case',
            ['==', ['get', 'admin_level'], 'state'], 3,      // Thick for states
            ['==', ['get', 'admin_level'], 'county'], 2,     // Medium for counties
            ['==', ['get', 'admin_level'], 'township'], 1.5, // Thin for townships
            ['==', ['get', 'admin_level'], 'section'], 1,    // Very thin for sections
            1 // Default
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,   // Faint at world scale
            4, 0.5,   // Medium at country scale
            8, 0.7,   // Good at state scale
            12, 0.9   // Full at detailed scale
          ]
        },
        layout: {}
      },
      // State Labels
      stateLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#2E5BBA',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2
        },
        layout: {
          'text-field': ['get', 'state_name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 12, 6, 18],
          'text-anchor': 'center',
          'text-transform': 'uppercase'
        },
        filter: ['==', ['get', 'admin_level'], 'state_label'],
        maxzoom: 8
      },
      // County Labels
      countyLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#CC7A00',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': ['get', 'county_name'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'county_label'],
        minzoom: 6,
        maxzoom: 8
      },
      // Township Labels
      townshipLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#1A5F1A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': [
            'format',
            ['get', 'township_name'], {},
            '\n', {},
            ['get', 'TWNSHPLAB'], { 'font-scale': 0.8 }
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'township_label'],
        minzoom: 8,
        maxzoom: 12
      },
      // Section Labels
      sectionLabels: {
        type: 'symbol',
        paint: {
          'text-color': '#A01030',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        },
        layout: {
          'text-field': ['get', 'section_label'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        filter: ['==', ['get', 'admin_level'], 'section_label'],
        minzoom: 12
      }
    }
  }) as PlssDataset;
}
