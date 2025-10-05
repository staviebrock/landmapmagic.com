import type { SsurgoDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';

// Default worker endpoint from environment or fallback
const getDefaultWorkerEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_WORKER_ENDPOINT || 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

/**
 * Create SSURGO soil dataset
 * SSURGO data is always sharded across multiple files for better performance with range queries
 * The worker API handles shard resolution and range request routing automatically
 * @param apiKey - API key for accessing the PMTiles endpoint (defaults to 'dev')
 */
export function makeSsurgoDataset(apiKey: string = 'dev'): SsurgoDataset {
  const dataset = makeVectorDataset({
    id: 'ssurgo',
    name: 'SSURGO Soil Data',
    description: 'Soil Survey Geographic Database - detailed soil information',
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/ssurgo.pmtiles?key=${apiKey}`,
    sourceLayer: 'ssurgo',
    attribution: 'USDA NRCS SSURGO',
    minzoom: 0,
    maxzoom: 17,
    layers: {
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            // Use musym (map unit symbol) for basic soil classification
            ['has', 'musym'],
            [
              'case',
              // Simple color scheme based on map unit symbol patterns
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['A', 'B', 'C']]], '#2E8B57', // Green for A-C series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['D', 'E', 'F']]], '#FFD700', // Gold for D-F series  
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['G', 'H', 'I']]], '#FF8C00', // Orange for G-I series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['J', 'K', 'L']]], '#DC143C', // Red for J-L series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['M', 'N', 'O']]], '#8B4513', // Brown for M-O series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['P', 'Q', 'R']]], '#CD853F', // Peru for P-R series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['S', 'T', 'U']]], '#D2691E', // Chocolate for S-U series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['V', 'W', 'X']]], '#32CD32', // LimeGreen for V-X series
              ['in', ['slice', ['get', 'musym'], 0, 1], ['literal', ['Y', 'Z']]], '#FFA500', // Orange for Y-Z series
              '#4A90E2' // Blue for numeric or other
            ],
            '#808080' // Gray for missing musym
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
  });

  // Add click info configuration
  (dataset as SsurgoDataset).clickInfoConfig = {
    title: (properties) => `Soil Unit: ${properties.musym || 'Unknown'}`,
    fields: [
      {
        key: 'musym',
        label: 'Map Unit Symbol',
        format: (value) => value || 'N/A'
      },
      {
        key: 'muname',
        label: 'Map Unit Name',
        format: (value) => value || 'N/A'
      },
      {
        key: 'mukind',
        label: 'Map Unit Kind',
        format: (value) => value || 'N/A'
      },
      {
        key: 'muacres',
        label: 'Acres',
        format: (value) => value ? `${Number(value).toLocaleString()} acres` : 'N/A'
      }
    ],
    layerIds: ['ssurgo-fill'] // Listen to click events on the fill layer
  };

  return dataset as SsurgoDataset;
}
