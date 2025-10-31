import { useMemo } from 'react';
import { makeSsurgoDataset, makeCdlDataset, makePlssDataset, makeCluDataset, makeStatesDataset } from '../core/makeVectorDataset.js';
import { makeGenericPMTilesDataset } from '../core/layers/generic.js';
import type { UseLandMapsReturn } from '../core/types.js';

/**
 * Hook to get land-related map datasets (SSURGO, CDL, PLSS, CLU, States)
 * Returns pre-configured datasets with source props and layers
 * @param apiKey - API key for accessing PMTiles and tile endpoints (defaults to 'dev')
 * @param apiUrl - Base API URL for all queries (optional, defaults to staging endpoint)
 * @param debugPMTilesPath - Optional debug PMTiles path for generic viewing
 * @param debugSourceLayer - Optional source layer name for debug PMTiles (defaults to 'generic')
 * @param borderColor - Border/outline color for layers (defaults vary by layer)
 * @param fillColor - Fill color for layers (defaults vary by layer)
 */
export function useLandMaps(
  apiKey: string = 'dev', 
  apiUrl?: string, 
  debugPMTilesPath?: string,
  debugSourceLayer?: string,
  borderColor?: string,
  fillColor?: string
): UseLandMapsReturn {
  const datasets = useMemo(() => {
    // Use generic PMTiles dataset if debug path is provided
    const statesDataset = debugPMTilesPath 
      ? makeGenericPMTilesDataset(apiKey, debugPMTilesPath, apiUrl, debugSourceLayer || 'generic')
      : makeStatesDataset(apiKey, apiUrl);

    return {
      ssurgo: makeSsurgoDataset(apiKey, apiUrl),
      cdl: makeCdlDataset(apiKey, apiUrl),
      plss: makePlssDataset(apiKey, apiUrl),
      clu: makeCluDataset(apiKey, apiUrl, borderColor, fillColor),
      states: statesDataset,
    };
  }, [apiKey, apiUrl, debugPMTilesPath, debugSourceLayer, borderColor, fillColor]);

  return datasets;
}
