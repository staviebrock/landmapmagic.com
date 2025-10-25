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
    attribution: 'USDA FSA',
    minzoom: 12,    // Allow viewing at all zoom levels
    maxzoom: 17,   // Match actual PMTiles data availability (layers can still render beyond this)
    layers: {
      // Simple field boundary fill layer
      fill: {
        type: 'fill',
        paint: {
          'fill-color': '#FF6B35',  // Simple orange color
          'fill-opacity': 0.4
        },
        layout: {},
        minzoom: 11,   // Show at all zoom levels
        maxzoom: 22   // Show at all zoom levels
      },
      // Simple field boundary outline layer
      outline: {
        type: 'line',
        paint: {
          'line-color': '#B8860B',  // Dark goldenrod
          'line-width': 1,
          'line-opacity': 0.8
        },
        layout: {},
        minzoom: 11,   // Show at all zoom levels
        maxzoom: 22   // Show at all zoom levels
      },
      // Hover highlight layer (only shows on hover)
      hover: {
        type: 'fill',
        paint: {
          'fill-color': '#FFD700',  // Bright gold highlight
          'fill-opacity': 0.6
        },
        layout: {},
        filter: ['==', ['get', 'id'], ''],  // Initially empty, populated by hover events
        minzoom: 11,   // Show at all zoom levels
        maxzoom: 22   // Show at all zoom levels
      }
    }
  });

  // Add click info configuration for CLU fields
  const clickInfoConfig = {
    title: (properties: Record<string, any>) => {
      const acres = properties.CALCACRES ? `${properties.CALCACRES.toFixed(1)} acres` : 'Unknown size';
      return `CLU Field (${acres})`;
    },
    layerIds: [`${dataset.id}-fill`, `${dataset.id}-outline`, `${dataset.id}-hover`],
    fields: [
      { key: 'id', label: 'Field ID', type: 'string' as const },
      { key: 'CALCACRES', label: 'Calculated Acres', type: 'number' as const, format: '0.2f' }
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
