import { makeVectorDataset } from '../makeVectorDataset.js';
import type { VectorDataset } from '../types.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create CLU (Common Land Unit) dataset
 * Provides field boundary data for agricultural analysis
 * @param apiKey - API key for accessing the PMTiles endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 */
export function makeCluDataset(apiKey: string = 'dev', apiUrl?: string): CluDataset {
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
    // Don't set maxzoom on source - let PMTiles metadata control it, layers will overzoom
    layers: {
      // Simple field boundary fill layer with hover state
      fill: {
        type: 'fill',
        'source-layer': 'clu',  // Polygon layer
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#FFD700',  // Bright gold on hover
            '#FF6B35'   // Default orange
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.7,  // More opaque on hover
            0.4   // Default opacity
          ]
        },
        layout: {},
        minzoom: 11   // Show at all zoom levels, no maxzoom to allow overzooming
      },
      // Simple field boundary outline layer with hover state
      outline: {
        type: 'line',
        'source-layer': 'clu',  // Polygon layer
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#FFD700',  // Bright gold on hover
            '#B8860B'   // Default dark goldenrod
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,  // Thicker on hover
            1   // Default width
          ],
          'line-opacity': 0.8
        },
        layout: {},
        minzoom: 11   // Show at all zoom levels, no maxzoom to allow overzooming
      },
      // Label points layer - representative points with acreage
      labels: {
        type: 'symbol',
        'source-layer': 'clu_labels',  // Point layer
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        },
        layout: {
          'text-field': ['concat', ['get', 'calcacres'], ' ac'],
          'text-size': 11,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          // 'text-allow-overlap': true,  // Allow labels to overlap with other symbols
          // 'text-ignore-placement': true,  // Don't hide labels due to collision
          // 'symbol-placement': 'point',  // Place at exact point location
          // 'text-anchor': 'center',  // Center text on point
          // 'text-rotation-alignment': 'map',  // Rotate with map
          // 'text-pitch-alignment': 'map'  // Pitch with map (stay flat on surface)
        },
        minzoom: 14   // Only show labels at high zoom, no maxzoom to allow overzooming
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
