/**
 * Generic PMTiles Layer
 * 
 * A universal layer for visualizing any PMTiles file without assumptions about
 * naming schemes, data structure, or feature types. Perfect for debugging.
 */

import { makeVectorDataset } from '../makeVectorDataset.js';
import type { VectorDataset } from '../types.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create a generic PMTiles dataset that shows all features without filtering
 * This is useful for debugging any PMTiles file regardless of its naming scheme
 * @param apiKey - API key for accessing the PMTiles endpoint
 * @param apiUrl - Base API URL for queries
 * @param bucketPath - Bucket path to the PMTiles file
 * @param sourceLayer - Source layer name (usually the same as the dataset type)
 */
export function makeGenericPMTilesDataset(
  apiKey: string = 'dev', 
  bucketPath: string, 
  apiUrl?: string, 
  sourceLayer: string = 'generic'
): VectorDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  
  return makeVectorDataset({
    id: `generic-pmtiles`,
    name: `Generic PMTiles Viewer`,
    description: `Universal PMTiles viewer for debugging any vector tile file`,
    url: `pmtiles://${workerEndpoint}/${bucketPath}?key=${apiKey}`,
    sourceLayer: sourceLayer,
    attribution: 'LandMapMagic.com',
    minzoom: 0,
    maxzoom: 14,
    layers: {
      // Generic fill layer - shows all polygon features
      fill: {
        type: 'fill',
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.2,   // Visible at world scale
            4, 0.3,   // More visible at country scale
            6, 0.4,   // Medium at regional scale
            8, 0.5,   // Visible at state scale
            10, 0.6,  // More visible at detailed scale
            12, 0.7,  // Very visible at local scale
            14, 0.8   // Maximum visibility
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Generic outline layer - shows all line features
      outline: {
        type: 'line',
        paint: {
          'line-color': '#2C5F8A',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,     // Visible at world scale
            4, 1.5,   // Medium at country scale
            6, 2,     // Thicker at regional scale
            8, 2.5,   // Thick at state scale
            10, 3,    // Thicker at detailed scale
            12, 3.5,  // Very thick at local scale
            14, 4     // Maximum thickness
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,   // Visible at world scale
            4, 0.9,   // More visible at country scale
            6, 1,     // Full opacity at regional scale
            8, 1,     // Full opacity at state scale
            10, 1,    // Full opacity at detailed scale
            12, 1,    // Full opacity at local scale
            14, 1     // Full opacity at maximum scale
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Generic point layer - shows all point features (like labels)
      points: {
        type: 'circle',
        paint: {
          'circle-color': '#FF6B6B',
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,     // Small at world scale
            4, 3,     // Medium at country scale
            6, 4,     // Larger at regional scale
            8, 5,     // Large at state scale
            10, 6,    // Larger at detailed scale
            12, 7,    // Very large at local scale
            14, 8     // Maximum size
          ],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.7,   // Visible at world scale
            4, 0.8,   // More visible at country scale
            6, 0.9,   // Very visible at regional scale
            8, 1,     // Full opacity at state scale
            10, 1,    // Full opacity at detailed scale
            12, 1,    // Full opacity at local scale
            14, 1     // Full opacity at maximum scale
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1,
        },
        layout: {
          visibility: 'visible',
        },
      },
    },
  });
}
