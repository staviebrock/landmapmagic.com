import { makeVectorDataset } from '../makeVectorDataset.js';
import type { VectorDataset } from '../types.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create CLU (Common Land Unit) dataset
 * Provides field boundary data for agricultural analysis
 * @param apiKey - API key for accessing the PMTiles endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 * @param borderColor - Border/outline color for CLU polygons (defaults to '#fde047' - yellow)
 */
export function makeCluDataset(
  apiKey: string = 'dev', 
  apiUrl?: string,
  borderColor: string = '#fde047'
): CluDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  const pmtilesUrl = `pmtiles://${workerEndpoint}/clu.pmtiles?key=${apiKey}`;
  console.log('🌾 Creating CLU dataset with:', { apiKey, apiUrl, workerEndpoint, pmtilesUrl });
  const dataset = makeVectorDataset({
    id: 'clu',
    name: 'Common Land Units',
    description: 'USDA FSA Common Land Unit field boundaries for agricultural analysis',
    url: pmtilesUrl,
    sourceLayer: 'clu',
    attribution: 'LandMapMagic.com',
    minzoom: 12,    // Allow viewing at all zoom levels
    promoteId: 'id',
    // Don't set maxzoom on source - let PMTiles metadata control it, layers will overzoom
    layers: {
      // Simple field boundary fill layer with hover state
      // fill: {
      //   type: 'fill',
      //   'source-layer': 'clu',  // Polygon layer
      //   paint: {
      //     'fill-color': [
      //       'case',
      //       ['boolean', ['feature-state', 'hover'], false],
      //       '#FFD700',  // Bright gold on hover
      //       fillColor   // Customizable fill color (default transparent)
      //     ],
      //     'fill-opacity': [
      //       'case',
      //       ['boolean', ['feature-state', 'hover'], false],
      //       0.7,  // More opaque on hover
      //       1.0   // Full opacity for fill color (transparency controlled by color itself)
      //     ]
      //   },
      //   layout: {},
      //   minzoom: 11   // Show at all zoom levels, no maxzoom to allow overzooming
      // },
      // Simple field boundary outline layer with hover effect expressions
      outline: {
        type: 'line',
        'source-layer': 'clu',  // Polygon layer
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#FFD700',  // Bright gold on hover
            borderColor
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            4,
            2
          ],
          'line-opacity': 0.9
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        minzoom: 11   // Show at all zoom levels, no maxzoom to allow overzooming
      },
      // Label points layer - representative points with acreage
      labels: {
        type: 'symbol',
        'source-layer': 'clu_labels',  // Point layer
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
        minzoom: 13   // Show labels earlier at zoom 13+
      }
    }
  });

  // Add click info configuration for CLU fields
  const clickInfoConfig = {
    title: (properties: Record<string, any>) => {
      // Check both lowercase and uppercase property names (tippecanoe lowercases properties)
      const acresValue = properties.calcacres || properties.CALCACRES;
      const acres = acresValue ? `${acresValue.toFixed(1)} acres` : 'Unknown size';
      return `CLU Field (${acres})`;
    },
    layerIds: [`${dataset.id}-outline`],
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
