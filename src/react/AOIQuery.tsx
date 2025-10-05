import React, { useState, useCallback } from 'react';
// @ts-ignore
import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';

export interface AOIQueryResult {
  layerName: string;
  layerId: string;
  features: any[];
  totalArea?: number;
  featureCount: number;
  summary: Record<string, any>;
  truncated?: boolean;
}

export interface AOIQueryProps {
  map: any;
  aoi: Feature<Polygon> | null;
  datasets: any;
  onResults?: (results: AOIQueryResult[]) => void;
  onError?: (error: string) => void;
  maxFeatures?: number;
  maxAcres?: number;
  minZoom?: number;
  enabled?: boolean;
}

// Lightweight query tool that doesn't interfere with map layers
export function AOIQuery({ 
  map, 
  aoi, 
  datasets, 
  onResults,
  onError,
  maxFeatures = 500,
  maxAcres = 1000,
  minZoom = 14,
  enabled = false
}: AOIQueryProps) {
  
  const [isQuerying, setIsQuerying] = useState(false);

  // Safe query execution with size limits
  const executeQuery = useCallback(async () => {
    if (!map || !aoi || !enabled || isQuerying) {
      onResults?.([]);
      return;
    }

    // Check zoom level first - only allow queries at tight zooms
    const currentZoom = map.getZoom();
    if (currentZoom < minZoom) {
      onError?.(`Zoom in closer to query data (current: ${currentZoom.toFixed(1)}, minimum: ${minZoom})`);
      return;
    }

    // Estimate query size before executing
    const aoiArea = turf.area(aoi) / 4047; // Convert to acres
    
    // Strict area limit - 1000 acres max
    if (aoiArea > maxAcres) {
      onError?.(`Query area too large (${Math.round(aoiArea)} acres). Maximum allowed: ${maxAcres} acres.`);
      return;
    }

    const estimatedFeatures = aoiArea * 2; // Rough estimate: 2 features per acre
    if (estimatedFeatures > maxFeatures) {
      onError?.(`Too many features estimated (${Math.round(estimatedFeatures)}). Please draw a smaller area.`);
      return;
    }

    setIsQuerying(true);

    try {
      const results: AOIQueryResult[] = [];

      // Only query available datasets, don't depend on visible layers
      for (const [datasetKey, dataset] of Object.entries(datasets)) {
        if (!dataset || typeof dataset !== 'object') continue;

        try {
          const result = await queryDatasetSafely(map, aoi, dataset as any, maxFeatures);
          if (result && result.features.length > 0) {
            results.push(result);
          }
        } catch (error) {
          console.warn(`Failed to query dataset ${datasetKey}:`, error);
          // Continue with other datasets instead of failing completely
        }
      }

      onResults?.(results);

    } catch (error) {
      console.error('AOI query failed:', error);
      onError?.(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setIsQuerying(false);
    }
  }, [map, aoi, datasets, enabled, isQuerying, maxFeatures, maxAcres, minZoom, onResults, onError]);

  // Execute query when conditions are met
  React.useEffect(() => {
    if (enabled && aoi && !isQuerying) {
      executeQuery();
    }
  }, [enabled, aoi, executeQuery, isQuerying]);

  return null; // This is a logic-only component
}

// Safe dataset querying that doesn't break the map
async function queryDatasetSafely(
  map: any, 
  aoi: Feature<Polygon>, 
  dataset: any, 
  maxFeatures: number
): Promise<AOIQueryResult | null> {
  
  // Only query if we have a reasonable area - much tighter limits
  const aoiBbox = turf.bbox(aoi);
  const bboxArea = (aoiBbox[2] - aoiBbox[0]) * (aoiBbox[3] - aoiBbox[1]);
  
  // Tighter bbox limit - roughly 0.01 degrees (~0.7 miles at 45° latitude)
  if (bboxArea > 0.01) { 
    throw new Error('Query area too large - zoom in closer');
  }

  // Try to query rendered features safely
  try {
    const screenBounds = [
      map.project([aoiBbox[0], aoiBbox[1]]),
      map.project([aoiBbox[2], aoiBbox[3]])
    ];

    // Get layer IDs for this dataset
    const layerIds = dataset.layers ? 
      Object.keys(dataset.layers).map((layerKey: string) => `${dataset.id}-${layerKey}`) :
      [dataset.id];

    let allFeatures: any[] = [];
    let featureCount = 0;

    for (const layerId of layerIds) {
      if (featureCount >= maxFeatures) break;
      
      // Check if layer exists before querying
      if (!map.getLayer(layerId)) continue;

      const features = map.queryRenderedFeatures(screenBounds, { 
        layers: [layerId] 
      });

      // Filter and limit features
      for (const feature of features) {
        if (featureCount >= maxFeatures) break;

        try {
          const featureGeom = feature.geometry || feature;
          if (turf.booleanIntersects(featureGeom, aoi.geometry)) {
            allFeatures.push(feature);
            featureCount++;
          }
        } catch (error) {
          // Skip problematic features instead of failing
          continue;
        }
      }
    }

    if (allFeatures.length === 0) return null;

    // Calculate summary
    const summary = calculateSummary(allFeatures, dataset, aoi);

    return {
      layerName: dataset.name || dataset.id,
      layerId: dataset.id,
      features: allFeatures,
      featureCount: allFeatures.length,
      summary: summary,
      truncated: featureCount >= maxFeatures
    };

  } catch (error) {
    console.warn(`Safe query failed for dataset ${dataset.id}:`, error);
    return null;
  }
}

// Calculate summary statistics for features within AOI
function calculateSummary(features: any[], dataset: any, aoi: Feature<Polygon>): Record<string, any> {
  const summary: Record<string, any> = {
    featureCount: features.length,
    aoiArea: turf.area(aoi)
  };

  // Dataset-specific summaries
  switch (dataset.id) {
    case 'ssurgo':
      return calculateSsurgoSummary(features, summary);
    case 'cdl':
      return calculateCdlSummary(summary);
    case 'plss':
      return calculatePlssSummary(features, summary);
    default:
      return summary;
  }
}

function calculateSsurgoSummary(features: any[], baseSummary: Record<string, any>) {
  const soilTypes = new Map<string, number>();
  const mapUnits = new Map<string, { name: string; count: number; acres: number }>();

  features.forEach(feature => {
    const props = feature.properties || {};
    
    // Count soil types by map unit symbol
    const musym = props.musym || 'Unknown';
    soilTypes.set(musym, (soilTypes.get(musym) || 0) + 1);
    
    // Aggregate map unit information
    const muname = props.muname || 'Unknown';
    const muacres = parseFloat(props.muacres) || 0;
    
    if (mapUnits.has(musym)) {
      const existing = mapUnits.get(musym)!;
      existing.count += 1;
      existing.acres += muacres;
    } else {
      mapUnits.set(musym, { name: muname, count: 1, acres: muacres });
    }
  });

  return {
    ...baseSummary,
    soilTypes: Object.fromEntries(soilTypes),
    mapUnits: Object.fromEntries(mapUnits),
    uniqueSoilTypes: soilTypes.size,
    totalAcres: Array.from(mapUnits.values()).reduce((sum, mu) => sum + mu.acres, 0)
  };
}

function calculateCdlSummary(baseSummary: Record<string, any>) {
  // CDL is raster data, so we'll provide basic info
  // In a real implementation, you might want to sample pixel values
  return {
    ...baseSummary,
    note: 'CDL raster data - pixel-level analysis would require additional processing'
  };
}

function calculatePlssSummary(features: any[], baseSummary: Record<string, any>) {
  const adminLevels = new Map<string, number>();
  const states = new Set<string>();
  const counties = new Set<string>();
  const townships = new Set<string>();
  const sections = new Set<string>();

  features.forEach(feature => {
    const props = feature.properties || {};
    
    const adminLevel = props.admin_level;
    if (adminLevel) {
      adminLevels.set(adminLevel, (adminLevels.get(adminLevel) || 0) + 1);
    }

    if (props.state_name) states.add(props.state_name);
    if (props.county_name) counties.add(props.county_name);
    if (props.township_name) townships.add(props.township_name);
    if (props.section_label) sections.add(props.section_label);
  });

  return {
    ...baseSummary,
    adminLevels: Object.fromEntries(adminLevels),
    uniqueStates: states.size,
    uniqueCounties: counties.size,
    uniqueTownships: townships.size,
    uniqueSections: sections.size,
    states: Array.from(states),
    counties: Array.from(counties)
  };
}
