import { makeVectorDataset } from '../makeVectorDataset.js';
import type { VectorDataset } from '../types.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create CLU (Common Land Unit) dataset
 * Provides field boundary data for agricultural analysis
 * No fill by default, hover to see fill, outline only
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 * @param borderColor - Border/outline color for CLU polygons (defaults to '#fde047' - yellow)
 */
export function makeCluDataset(
  apiKey: string = 'dev', 
  apiUrl?: string,
  borderColor: string = '#fde047'
): CluDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const tilesUrl = `${workerEndpoint}/v1/tiles/clu/{z}/{x}/{y}.mvt?key=${apiKey}`;
  console.log('🌾 Creating CLU dataset with:', { apiKey, apiUrl, workerEndpoint, tilesUrl });
  const dataset = makeVectorDataset({
    id: 'clu',
    name: 'Common Land Units',
    description: 'USDA FSA Common Land Unit field boundaries for agricultural analysis',
    tiles: [tilesUrl],
    sourceLayer: 'clu',
    attribution: 'LandMapMagic.com',
    minzoom: 12,
    promoteId: 'id',
    layers: {
      // Fill layer - transparent by default, shows on hover
      fill: {
        type: 'fill',
        'source-layer': 'clu',
        paint: {
          'fill-color': '#fde047', // Yellow fill on hover
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.35, // Slightly higher opacity for CLU hover since it's the deepest layer
            0     // No fill by default
          ],
        },
        layout: {
          visibility: 'visible',
        },
        minzoom: 11
      },
      // Simple field boundary outline layer with hover effect
      outline: {
        type: 'line',
        'source-layer': 'clu',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#facc15',  // Brighter yellow on hover
            borderColor
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,  // Thicker on hover
            1.5 // Normal width
          ],
          'line-opacity': 0.9
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        minzoom: 11
      },
      // Label points layer - representative points with acreage
      labels: {
        type: 'symbol',
        'source-layer': 'clu_labels',
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 3,
          'text-halo-blur': 1,
          'text-opacity': 1.0
        },
        layout: {
          'text-field': ['concat', ['get', 'calcacres'], ' ac'],
          'text-size': 14,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold', 'Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-allow-overlap': false,
          'text-anchor': 'center',
          'symbol-placement': 'point',
          'text-padding': 2,
          'text-optional': false
        },
        minzoom: 13
      }
    }
  });

  // Add click info configuration for CLU fields
  const clickInfoConfig = {
    title: (properties: Record<string, any>) => {
      const acresValue = properties.calcacres || properties.CALCACRES;
      const acres = acresValue ? `${acresValue.toFixed(1)} acres` : 'Unknown size';
      return `CLU Field (${acres})`;
    },
    layerIds: [`${dataset.id}-fill`, `${dataset.id}-outline`],
    fields: [
      { key: 'id', label: 'Field ID' },
      { 
        key: 'calcacres', 
        label: 'Calculated Acres', 
        format: (value: number) => value ? `${value.toFixed(2)} acres` : 'N/A'
      }
    ]
  };

  return {
    ...dataset,
    clickInfoConfig
  } as CluDataset;
}

// Type definition for CLU dataset
export interface CluDataset extends VectorDataset {
  id: 'clu';
}
