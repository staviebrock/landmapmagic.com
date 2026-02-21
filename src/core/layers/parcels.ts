import type { ParcelsDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create MVT tile URL for parcels
 * @param apiKey - API key for accessing the tile endpoint
 * @param apiUrl - Base API URL for queries
 */
export function getParcelsTilesUrl(apiKey: string = 'dev', apiUrl?: string): string {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  return `${workerEndpoint}/v1/tiles/parcels/{z}/{x}/{y}.mvt?key=${apiKey}`;
}

/**
 * Create Parcels dataset
 * Individual land parcel boundaries with owner/acreage data
 * Transparent fill with yellow borders, hover highlight
 * Visible at zoom 14+ (parcel-level detail)
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeParcelsDataset(apiKey: string = 'dev', apiUrl?: string): ParcelsDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const dataset = makeVectorDataset({
    id: 'parcels',
    name: 'Parcels',
    description: 'Individual land parcel boundaries with ownership data',
    tiles: [`${workerEndpoint}/v1/tiles/parcels/{z}/{x}/{y}.mvt?key=${apiKey}`],
    sourceLayer: 'parcels',
    attribution: 'LandMapMagic.com',
    minzoom: 12,
    maxzoom: 17,
    promoteId: 'parcel_id',
    layers: {
      // Fill layer - transparent by default, light yellow highlight on hover
      fill: {
        type: 'fill',
        'source-layer': 'parcels',
        paint: {
          'fill-color': '#fde047',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.2,
            0,
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Outline layer - yellow borders matching sections style family
      outline: {
        type: 'line',
        'source-layer': 'parcels',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#facc15',   // Brighter yellow on hover
            '#fde047',   // Yellow
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 0.5,
            14, 1,
            16, 1.5,
            17, 2,
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 0.4,
            14, 0.85,
            17, 1,
          ],
        },
        layout: {
          visibility: 'visible',
        },
      },
      // Owner name labels - fade in at zoom 16+
      labels: {
        type: 'symbol',
        'source-layer': 'parcels',
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            16, 0.8,
            17, 1.0,
          ],
        },
        layout: {
          'text-field': [
            'coalesce',
            ['get', 'owner'],
            ['get', 'owner_name'],
            '',
          ],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 9,
            16, 11,
            17, 12,
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-max-width': 8,
          'text-allow-overlap': false,
          visibility: 'visible',
        },
      },
    },
  });

  // Add click info config
  dataset.clickInfoConfig = {
    title: (properties) => {
      return properties.owner || properties.owner_name || `Parcel ${properties.parcel_id || ''}`;
    },
    fields: [
      { key: 'parcel_id', label: 'Parcel ID' },
      { key: 'addr_full', label: 'Address', format: (v) => v || '' },
      { key: 'address', label: 'Address', format: (v) => v || '' },
      {
        key: 'acreage_calc',
        label: 'Acreage',
        format: (v) => v != null ? `${parseFloat(v).toFixed(2)} ac` : '',
      },
      {
        key: 'acreage',
        label: 'Acreage',
        format: (v) => v != null ? `${parseFloat(v).toFixed(2)} ac` : '',
      },
      {
        key: 'mkt_val_tot',
        label: 'Market Value',
        format: (v) => v != null ? `$${Number(v).toLocaleString()}` : '',
      },
      {
        key: 'market_value',
        label: 'Market Value',
        format: (v) => v != null ? `$${Number(v).toLocaleString()}` : '',
      },
      { key: 'county_name', label: 'County' },
      { key: 'state_abbr', label: 'State' },
    ],
    layerIds: ['parcels-fill', 'parcels-outline'],
  };

  return dataset as ParcelsDataset;
}
