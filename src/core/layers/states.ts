import type { StatesDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create PMTiles URL dynamically based on current selection
 * @param apiKey - API key for accessing the PMTiles endpoint
 * @param apiUrl - Base API URL for queries
 * @param bucketPath - Optional bucket path for debugging (e.g., 'bucket/states/debug_states.pmtiles')
 */
export function getStatesPMTilesUrl(apiKey: string = 'dev', apiUrl?: string, bucketPath?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const pmtilesPath = bucketPath || 'states.pmtiles';
  return `pmtiles://${workerEndpoint}/${pmtilesPath}?key=${apiKey}`;
}


/**
 * Create States dataset
 * US state boundaries with clean styling
 * @param apiKey - API key for accessing the PMTiles endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeStatesDataset(apiKey: string = 'dev', apiUrl?: string): StatesDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'states',
    name: 'US States',
    description: 'US state boundaries',
    url: `pmtiles://${workerEndpoint}/states.pmtiles?key=${apiKey}`,
    sourceLayer: 'states',
    attribution: 'LandMapMagic.com',
    minzoom: 0,
    maxzoom: 10,
    layers: {
      // Fill layer for state polygons
      fill: {
        type: 'fill',
        filter: ['==', ['get', 'admin_level'], 'state'],
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.1,   // Very transparent at world scale
            4, 0.2,   // Light at country scale
            6, 0.3,   // Medium at regional scale
            8, 0.4,   // More visible at state scale
            10, 0.5   // Most visible at detailed scale
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Outline layer for state boundaries
      outline: {
        type: 'line',
        filter: ['==', ['get', 'admin_level'], 'state'],
        paint: {
          'line-color': '#2C5F8A',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,   // Thin at world scale
            4, 1,     // Medium at country scale
            6, 1.5,   // Thicker at regional scale
            8, 2,     // Thick at state scale
            10, 2.5   // Thickest at detailed scale
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,   // Light at world scale
            4, 0.5,   // Medium at country scale
            6, 0.7,   // More visible at regional scale
            8, 0.8,   // Very visible at state scale
            10, 0.9   // Most visible at detailed scale
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for state names using dedicated label points
      labels: {
        type: 'symbol',
        filter: ['==', ['get', 'admin_level'], 'state_label'],
        paint: {
          'text-color': '#2E5BBA',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.7,   // Slightly transparent at world scale
            4, 0.9,   // More visible at country scale
            6, 1.0    // Fully visible at regional scale and higher
          ],
        },
        layout: {
          'text-field': ['get', 'NAME'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 8,    // Tiny at world view
            3, 12,   // Small at zoom 3
            5, 16,   // Growing
            6, 18,   // Medium at zoom 6
            8, 24,   // Large at zoom 8
            10, 30   // Largest at zoom 10
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': true,     // Show all labels (like PLSS v1)
          'text-ignore-placement': true,  // Ignore collision detection (like PLSS v1)
          'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.5,
          'symbol-sort-key': ['get', 'GEOID'],
          visibility: 'visible',
        },
      },
    },
  });

  // Add click info config after dataset creation
  dataset.clickInfoConfig = {
    fields: [
      { key: 'NAME', label: 'State Name' },
      { key: 'STUSPS', label: 'State Code' },
      { key: 'GEOID', label: 'GEOID' }
    ],
    layerIds: ['states-fill', 'states-outline', 'states-labels'],
  };

  return dataset as StatesDataset;
}
