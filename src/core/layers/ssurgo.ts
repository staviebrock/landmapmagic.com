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
