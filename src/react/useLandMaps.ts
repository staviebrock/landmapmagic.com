import { useMemo } from 'react';
import { makeSsurgoDataset, makeCdlDataset, makePlssDataset, makeCluDataset, makeStatesDataset, makeCountiesDataset, makeTownshipsDataset, makeSectionsDataset, makeParcelsDataset } from '../core/makeVectorDataset.js';
import type { UseLandMapsReturn } from '../core/types.js';

/**
 * Hook to get land-related map datasets (SSURGO, CDL, PLSS, CLU, States, Counties, Townships, Sections, Parcels)
 * Returns pre-configured datasets with source props and layers using MVT tiles
 * @param apiKey - API key for accessing tile endpoints (defaults to 'dev')
 * @param apiUrl - Base API URL for all queries (optional, defaults to staging endpoint)
 * @param borderColor - Border/outline color for layers (defaults vary by layer)
 * @param cdlYear - CDL year to display (defaults to '2024')
 */
export function useLandMaps(
  apiKey: string = 'dev', 
  apiUrl?: string, 
  borderColor?: string,
  cdlYear: string = '2024'
): UseLandMapsReturn {
  const datasets = useMemo(() => {
    return {
      ssurgo: makeSsurgoDataset(apiKey, apiUrl),
      cdl: makeCdlDataset(apiKey, apiUrl, cdlYear),
      plss: makePlssDataset(apiKey, apiUrl),
      clu: makeCluDataset(apiKey, apiUrl, borderColor),
      states: makeStatesDataset(apiKey, apiUrl),
      counties: makeCountiesDataset(apiKey, apiUrl),
      townships: makeTownshipsDataset(apiKey, apiUrl),
      sections: makeSectionsDataset(apiKey, apiUrl),
      parcels: makeParcelsDataset(apiKey, apiUrl),
    };
  }, [apiKey, apiUrl, borderColor, cdlYear]);

  return datasets;
}
