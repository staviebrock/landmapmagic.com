import type { CdlDataset, DatasetSource, DatasetLayer } from '../types.js';
import { DEFAULT_WORKER_ENDPOINT } from '../utils.js';

/**
 * Create CDL cropland dataset using raster tiles
 * Uses pre-rendered PNG tiles with USDA crop colors
 * @param apiKey - API key for accessing the tile endpoint (defaults to 'dev')
 * @param apiUrl - Base API URL for queries (optional, defaults to staging endpoint)
 * @param year - CDL year to display (defaults to 2024)
 */
export function makeCdlDataset(apiKey: string = 'dev', apiUrl?: string, year: string = '2024'): CdlDataset {
  const workerEndpoint = apiUrl || DEFAULT_WORKER_ENDPOINT;
  // Create raster source for CDL PNG tiles
  const sourceProps: DatasetSource = {
    type: 'raster',
    tiles: [`${workerEndpoint}/v1/tiles/cdl/{z}/{x}/{y}.png?key=${apiKey}&year=${year}`],
    tileSize: 256,
    minzoom: 5,  // CDL tiles start at zoom 5
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
