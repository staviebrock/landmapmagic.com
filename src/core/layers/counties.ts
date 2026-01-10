import type { CountiesDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create MVT tile URL for counties
 * @param apiKey - API key for accessing the tile endpoint
 * @param apiUrl - Base API URL for queries
 */
export function getCountiesTilesUrl(apiKey: string = 'dev', apiUrl?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  return `${workerEndpoint}/v1/tiles/counties/{z}/{x}/{y}.mvt?key=${apiKey}`;
}

/**
 * Create Counties dataset
 * US county boundaries with clean styling
 * No fill by default, hover to see fill, outline only
 * Line becomes thicker when this is the "parent" layer (at higher zoom levels)
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeCountiesDataset(apiKey: string = 'dev', apiUrl?: string): CountiesDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'counties',
    name: 'US Counties',
    description: 'US county boundaries',
    tiles: [`${workerEndpoint}/v1/tiles/counties/{z}/{x}/{y}.mvt?key=${apiKey}`],
    sourceLayer: 'counties',
    attribution: 'LandMapMagic.com',
    minzoom: 0,
    maxzoom: 14, // Extended to allow showing as parent layer at higher zooms
    promoteId: 'GEOID', // For feature-state hover
    layers: {
      // Fill layer - transparent by default, shows on hover
      fill: {
        type: 'fill',
        'source-layer': 'counties',
        paint: {
          'fill-color': '#fde047', // Yellow fill on hover
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.25, // Show fill on hover
            0     // No fill by default
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Outline layer for county boundaries
      // Line gets thicker at higher zoom levels (when counties is parent layer)
      outline: {
        type: 'line',
        'source-layer': 'counties',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#facc15', // Brighter yellow on hover
            '#fde047'  // Yellow
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,
            4, 0.75,
            6, 1,      // Thin at states zoom (counties barely visible)
            8, 1.5,    // Normal width at counties zoom
            10, 2.5,   // Thicker when townships visible
            12, 3.5,   // Even thicker when sections visible
            14, 4.5    // Very thick when CLU visible
          ],
          'line-opacity': 0.9,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for county names
      labels: {
        type: 'symbol',
        'source-layer': 'counties_labels',
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0,
            6, 0.7,
            8, 0.9,
            10, 1.0
          ],
        },
        layout: {
          'text-field': ['get', 'NAME'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 8,
            6, 10,
            8, 12,
            10, 14,
            12, 16
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          visibility: 'visible',
        },
      },
    },
  });

  // Add click info config after dataset creation
  dataset.clickInfoConfig = {
    fields: [
      { key: 'NAME', label: 'County Name' },
      { key: 'STATE_NAME', label: 'State' },
      { key: 'STATEFP', label: 'State FIPS' },
      { key: 'COUNTYFP', label: 'County FIPS' }
    ],
    layerIds: ['counties-fill', 'counties-outline'],
  };

  return dataset as CountiesDataset;
}
