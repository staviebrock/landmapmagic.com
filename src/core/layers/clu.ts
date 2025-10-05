import { makeVectorDataset } from '../makeVectorDataset.js';
import type { VectorDataset } from '../types.js';

const getDefaultWorkerEndpoint = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

/**
 * Create CLU (Common Land Unit) dataset
 * Provides field boundary data for agricultural analysis
 * @param apiKey - API key for accessing the PMTiles endpoint (defaults to 'dev')
 */
export function makeCluDataset(apiKey: string = 'dev'): CluDataset {
  const dataset = makeVectorDataset({
    id: 'clu',
    name: 'Common Land Units',
    description: 'USDA FSA Common Land Unit field boundaries for agricultural analysis',
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/clu.pmtiles?key=${apiKey}`,

    sourceLayer: 'clu',
    attribution: 'USDA FSA',
    minzoom: 0,
    maxzoom: 17,
    layers: {
      // Field boundary fill layer
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ['has', 'calc_acres'], 
            [
              'interpolate',
              ['linear'],
              ['get', 'calc_acres'],
              0, '#FFF3CD',      // Very light yellow for small fields
              10, '#FFE066',     // Light yellow for medium fields  
              50, '#FFD700',     // Gold for larger fields
              100, '#FFA500',    // Orange for very large fields
              500, '#FF6B35'     // Red-orange for huge fields
            ],
            '#E6E6FA' // Light gray for fields without acreage data
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.1,   // Very transparent at world scale
            8, 0.3,   // Light at state scale
            12, 0.5,  // Medium at county scale
            14, 0.7,  // More visible at field scale
            16, 0.8   // High opacity for detailed view
          ]
        },
        layout: {}
      },
      // Field boundary outline layer
      outline: {
        type: 'line',
        paint: {
          'line-color': [
            'case',
            ['has', 'calc_acres'],
            '#B8860B',  // Dark goldenrod for fields with data
            '#808080'   // Gray for fields without data
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.5,   // Thin lines at state scale
            12, 1,    // Medium lines at county scale
            14, 1.5,  // Thicker lines at field scale
            16, 2     // Thick lines for detailed view
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.3,   // Faint at state scale
            12, 0.6,  // Medium at county scale
            14, 0.8,  // Strong at field scale
            16, 1.0   // Full opacity for detailed view
          ]
        },
        layout: {}
      }
    }
  });

  // Add click info configuration for CLU fields
  const clickInfoConfig = {
    title: (properties: Record<string, any>) => `CLU Field: ${properties.clu_number || 'Unknown'}`,
    layerIds: [`${dataset.id}-fill`, `${dataset.id}-outline`],
    fields: [
      { key: 'clu_number', label: 'CLU Number', type: 'string' as const },
      { key: 'calc_acres', label: 'Calculated Acres', type: 'number' as const, format: '0.2f' },
      { key: 'farm_number', label: 'Farm Number', type: 'string' as const },
      { key: 'tract_number', label: 'Tract Number', type: 'string' as const },
      { key: 'field_number', label: 'Field Number', type: 'string' as const },
      { key: 'subfield_number', label: 'Subfield Number', type: 'string' as const },
      { key: 'state_code', label: 'State', type: 'string' as const },
      { key: 'county_code', label: 'County Code', type: 'string' as const },
      { key: 'admin_state', label: 'Admin State', type: 'string' as const },
      { key: 'admin_county', label: 'Admin County', type: 'string' as const }
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
