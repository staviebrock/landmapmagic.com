import type { CdlDataset, DatasetSource, DatasetLayer } from '../types.js';

// Default worker endpoint from environment or fallback
const getDefaultWorkerEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_WORKER_ENDPOINT || 'http://localhost:8787';
  }
  return 'http://localhost:8787';
};

const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();

/**
 * Create CDL cropland dataset using raster tiles from TiTiler
 */
export function makeCdlDataset(): CdlDataset {
  // Create raster source for CDL data
  const sourceProps: DatasetSource = {
    type: 'raster',
    tiles: [`${DEFAULT_WORKER_ENDPOINT}/cdl/tiles/{z}/{x}/{y}?key=dev&year=2024`],
    tileSize: 256,
    minzoom: 0,  // Support zoom level 0 as requested
    maxzoom: 16,
    attribution: 'LandMapMagic.com'
  };

  // Create raster layer configuration
  const layers: Record<string, DatasetLayer> = {
    raster: {
      id: 'cdl-raster',
      type: 'raster',
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 0.5,   // Low opacity at zoom 0
          3, 0.6,   // Medium opacity at zoom 3
          8, 0.7,   // Good opacity at zoom 8
          10, 0.8,  // High opacity at zoom 10
          12, 0.9,  // Very high opacity at zoom 12
          14, 1.0   // Full opacity at zoom 14+
        ],
        'raster-fade-duration': 300
      },
      layout: {}
    }
  };

  return {
    id: 'cdl',
    name: 'Cropland Data Layer',
    description: 'USDA NASS Cropland Data Layer - crop type classification',
    sourceProps,
    layers,
    attribution: '© USDA NASS'
  } as CdlDataset;
}
