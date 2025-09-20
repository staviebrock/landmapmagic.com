import { useMemo } from 'react';
import { makeSsurgoDataset, makeCdlDataset, makePlssDataset } from '../core/makeVectorDataset.js';
import type { UseLandMapsReturn } from '../core/types.js';

/**
 * Hook to get land-related map datasets (SSURGO, CDL, PLSS)
 * Returns pre-configured datasets with source props and layers
 */
export function useLandMaps(): UseLandMapsReturn {
  const datasets = useMemo(() => {
    return {
      ssurgo: makeSsurgoDataset(),
      cdl: makeCdlDataset(),
      plss: makePlssDataset(),
    };
  }, []);

  return datasets;
}
