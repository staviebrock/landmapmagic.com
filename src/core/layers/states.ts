import type { StatesDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create MVT tile URL for states
 * @param apiKey - API key for accessing the tile endpoint
 * @param apiUrl - Base API URL for queries
 */
export function getStatesTilesUrl(apiKey: string = 'dev', apiUrl?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT; 
  return `${workerEndpoint}/v1/tiles/states/{z}/{x}/{y}.mvt?key=${apiKey}`;
}


/**
 * Create States dataset
 * US state boundaries with clean styling
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeStatesDataset(apiKey: string = 'dev', apiUrl?: string): StatesDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'states',
    name: 'US States',
    description: 'US state boundaries',
    tiles: [`${workerEndpoint}/v1/tiles/states/{z}/{x}/{y}.mvt?key=${apiKey}`],
    sourceLayer: 'states',
    attribution: 'LandMapMagic.com',
    minzoom: 0,
    maxzoom: 6,
    layers: {
      // Fill layer for state polygons - source-layer: 'states'
      fill: {
        type: 'fill',
        'source-layer': 'states',
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,
            4, 0.35,
            6, 0.4
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Outline layer for state boundaries - source-layer: 'states'
      outline: {
        type: 'line',
        'source-layer': 'states',
        paint: {
          'line-color': '#fde047', // Yellow like Google Maps example
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            4, 2,
            6, 2.5,
            8, 3,
            10, 3.5
          ],
          'line-opacity': 0.9,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for state names - source-layer: 'states_labels' (representative points)
      labels: {
        type: 'symbol',
        'source-layer': 'states_labels',
        paint: {
          'text-color': '#2E5BBA',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2,
          'text-opacity': 1,
        },
        layout: {
          'text-field': ['get', 'NAME'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 10,
            3, 14,
            5, 18,
            6, 22
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
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
      { key: 'STATEFP', label: 'State FIPS' }
    ],
    layerIds: ['states-fill', 'states-outline'],
  };

  return dataset as StatesDataset;
}
