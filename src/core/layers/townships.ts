import type { TownshipsDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create MVT tile URL for townships
 * @param apiKey - API key for accessing the tile endpoint
 * @param apiUrl - Base API URL for queries
 */
export function getTownshipsTilesUrl(apiKey: string = 'dev', apiUrl?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  return `${workerEndpoint}/v1/tiles/townships/{z}/{x}/{y}.mvt?key=${apiKey}`;
}

/**
 * Create Townships dataset
 * PLSS township boundaries
 * No fill by default, hover to see fill, outline only
 * Line becomes thicker when this is the "parent" layer (at higher zoom levels)
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeTownshipsDataset(apiKey: string = 'dev', apiUrl?: string): TownshipsDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'townships',
    name: 'Townships',
    description: 'PLSS township boundaries',
    tiles: [`${workerEndpoint}/v1/tiles/townships/{z}/{x}/{y}.mvt?key=${apiKey}`],
    sourceLayer: 'townships',
    attribution: 'LandMapMagic.com',
    minzoom: 0,
    maxzoom: 16, // Extended to allow showing as parent layer at higher zooms
    promoteId: 'PLSSID', // For feature-state hover
    layers: {
      // Fill layer - transparent by default, shows on hover
      fill: {
        type: 'fill',
        'source-layer': 'townships',
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
      // Outline layer for township boundaries
      // Line gets thicker at higher zoom levels (when townships is parent layer)
      outline: {
        type: 'line',
        'source-layer': 'townships',
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
            6, 0.5,
            8, 0.75,
            10, 1,     // Normal width at townships zoom
            12, 2,     // Thicker when sections visible
            14, 3,     // Even thicker when CLU visible
            16, 4      // Very thick at max zoom
          ],
          'line-opacity': 0.8,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for township names
      labels: {
        type: 'symbol',
        'source-layer': 'townships_labels',
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 0,
            8, 0.8,
            10, 1.0
          ],
        },
        layout: {
          'text-field': ['get', 'TWNSHPLAB'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 10,
            8, 12,
            10, 14,
            12, 16
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          visibility: 'visible',
        },
      },
    },
  });

  // Add click info config
  dataset.clickInfoConfig = {
    fields: [
      { key: 'TWNSHPLAB', label: 'Township' },
      { key: 'PLSSID', label: 'PLSS ID' },
      { key: 'STATEABBR', label: 'State' }
    ],
    layerIds: ['townships-fill', 'townships-outline'],
  };

  return dataset as TownshipsDataset;
}
