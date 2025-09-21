import type { CdlDataset } from '../types.js';
import { makeVectorDataset } from '../makeVectorDataset.js';

// Default worker endpoint from environment or fallback
const getDefaultWorkerEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_WORKER_ENDPOINT || 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

/**
 * Create CDL cropland dataset
 */
export function makeCdlDataset(): CdlDataset {
  return makeVectorDataset({
    id: 'cdl',
    name: 'Cropland Data Layer',
    description: 'USDA NASS Cropland Data Layer - crop type classification',
    url: `pmtiles://${DEFAULT_WORKER_ENDPOINT}/cdl.pmtiles?key=dev`,
    sourceLayer: 'crops',
    attribution: '© USDA NASS',
    minzoom: 8,
    maxzoom: 14,
    layers: {
      fill: {
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'crop_type'],
            'corn', '#FFD700',
            'soybeans', '#32CD32',
            'wheat', '#DEB887',
            'cotton', '#F5F5DC',
            'rice', '#87CEEB',
            'alfalfa', '#9ACD32',
            'other_hay', '#90EE90',
            'pasture', '#98FB98',
            'forest', '#228B22',
            'developed', '#696969',
            'water', '#4682B4',
            '#CCCCCC' // default
          ],
          'fill-opacity': 0.7
        },
        layout: {}
      }
    }
  }) as CdlDataset;
}
