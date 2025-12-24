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
    maxzoom: 12,
    layers: {
      // Fill layer for county polygons - source-layer: 'counties'
      fill: {
        type: 'fill',
        'source-layer': 'counties',
        paint: {
          'fill-color': '#8B7355',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 0.05,
            4, 0.1,
            6, 0.12,
            8, 0.15,
            10, 0.18,
            12, 0.2
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Outline layer for county boundaries - source-layer: 'counties'
      outline: {
        type: 'line',
        'source-layer': 'counties',
        paint: {
          'line-color': '#fde047', // Yellow like Google Maps example
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 0.5,
            4, 1,
            6, 1.5,
            8, 2,
            10, 2.5,
            12, 3
          ],
          'line-opacity': 0.9,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for county names - source-layer: 'counties_labels' (representative points)
      labels: {
        type: 'symbol',
        'source-layer': 'counties_labels',
        paint: {
          'text-color': '#5D4E37',
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

