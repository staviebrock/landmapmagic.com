import type { SectionsDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create MVT tile URL for sections
 * @param apiKey - API key for accessing the tile endpoint
 * @param apiUrl - Base API URL for queries
 */
export function getSectionsTilesUrl(apiKey: string = 'dev', apiUrl?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  return `${workerEndpoint}/v1/tiles/sections/{z}/{x}/{y}.mvt?key=${apiKey}`;
}

/**
 * Create Sections dataset
 * PLSS section boundaries (1 mile x 1 mile grid)
 * No fill by default, hover to see fill, outline only
 * Line becomes thicker when this is the "parent" layer (at higher zoom levels)
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeSectionsDataset(apiKey: string = 'dev', apiUrl?: string): SectionsDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'sections',
    name: 'Sections',
    description: 'PLSS section boundaries (1 mile grid)',
    tiles: [`${workerEndpoint}/v1/tiles/sections/{z}/{x}/{y}.mvt?key=${apiKey}`],
    sourceLayer: 'sections',
    attribution: 'LandMapMagic.com',
    minzoom: 8,
    maxzoom: 16,
    promoteId: 'PLSSID', // For feature-state hover
    layers: {
      // Fill layer - transparent by default, shows on hover
      fill: {
        type: 'fill',
        'source-layer': 'sections',
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
      // Outline layer for section boundaries
      // Line gets thicker at higher zoom levels (when sections is parent layer)
      outline: {
        type: 'line',
        'source-layer': 'sections',
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
            8, 0.5,
            10, 0.75,
            12, 1,     // Normal width at sections zoom
            14, 2,     // Thicker when CLU visible
            16, 3      // Very thick at max zoom
          ],
          'line-opacity': 0.7,
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Label layer for section numbers
      labels: {
        type: 'symbol',
        'source-layer': 'sections_labels',
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            12, 0.8,
            14, 1.0
          ],
        },
        layout: {
          'text-field': ['get', 'FRSTDIVNO'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 10,
            12, 12,
            14, 14
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
      { key: 'FRSTDIVNO', label: 'Section Number' },
      { key: 'PLSSID', label: 'PLSS ID' },
      { key: 'TWNSHPLAB', label: 'Township' },
      { key: 'STATEABBR', label: 'State' }
    ],
    layerIds: ['sections-fill', 'sections-outline'],
  };

  return dataset as SectionsDataset;
}
