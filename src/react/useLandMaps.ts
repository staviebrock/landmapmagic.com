import { useMemo } from 'react';
import { makeSsurgoDataset, makeCdlDataset, makePlssDataset, makeCluDataset } from '../core/makeVectorDataset.js';
import type { UseLandMapsReturn } from '../core/types.js';

/**
 * Hook to get land-related map datasets (SSURGO, CDL, PLSS, CLU)
 * Returns pre-configured datasets with source props and layers
 * @param apiKey - API key for accessing PMTiles and tile endpoints (defaults to 'dev')
 */
export function useLandMaps(apiKey: string = 'dev'): UseLandMapsReturn {
  const datasets = useMemo(() => {
    return {
      ssurgo: makeSsurgoDataset(apiKey),
      cdl: makeCdlDataset(apiKey),
      plss: makePlssDataset(apiKey),
      clu: makeCluDataset(apiKey),
    };
  }, [apiKey]);

  return datasets;
}
