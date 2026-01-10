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
 * No fill by default, hover to see fill, outline only
 * Line becomes thicker when this is the "parent" layer (at higher zoom levels)
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
    maxzoom: 14, // Extended to allow showing as parent layer at higher zooms
    promoteId: 'STATEFP', // For feature-state hover
    layers: {
      // Fill layer - transparent by default, shows on hover
      fill: {
        type: 'fill',
        'source-layer': 'states',
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
      // Outline layer for state boundaries
      // Line gets thicker at higher zoom levels (when states is parent layer)
      outline: {
        type: 'line',
        'source-layer': 'states',
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
            0, 1,
            4, 1.5,
            6, 2,      // Normal width at states zoom
            8, 3,      // Thicker when counties visible
            10, 4,     // Even thicker when townships visible
            12, 5,     // Thick when sections visible
            14, 6      // Very thick when CLU visible
          ],
          'line-opacity': 0.9,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for state names
      labels: {
        type: 'symbol',
        'source-layer': 'states_labels',
        paint: {
          'text-color': '#1f2937',
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
