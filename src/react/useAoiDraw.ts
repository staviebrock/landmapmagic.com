import { useState, useCallback, useMemo } from 'react';
import type { Point, Polygon } from 'geojson';
import type { 
  AoiState, 
  AoiPoint, 
  AoiPolygon, 
  AoiMode, 
  UseAoiDrawReturn,
  DatasetSource,
  DatasetLayer
} from '../core/types.js';

// Using simple geometry creation instead of turf for better type compatibility
function createPoint(coordinates: [number, number]): Point {
  return {
    type: 'Point',
    coordinates,
  };
}

function createPolygon(coordinates: number[][][]): Polygon {
  return {
    type: 'Polygon',
    coordinates,
  };
}

/**
 * Hook for managing AOI (Area of Interest) drawing state and interactions
 */
export function useAoiDraw(initialMode: AoiMode = 'draw'): UseAoiDrawReturn {
  const [mode, setMode] = useState<AoiMode>(initialMode);
  const [aoi, setAoi] = useState<AoiState>({
    points: [],
    polygon: null,
    isDrawing: false,
    isComplete: false,
  });

  // Handle map click for drawing AOI
  const handleMapClick = useCallback((event: { lngLat: [number, number] }) => {
    if (mode !== 'draw') return;

    const [lng, lat] = event.lngLat;
    const newPoint: AoiPoint = {
      id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      coordinates: [lng, lat],
    };

    setAoi(prev => {
      const newPoints = [...prev.points, newPoint];
      let newPolygon: AoiPolygon | null = null;
      let isComplete = false;

      // Create polygon if we have 3 or more points
      if (newPoints.length >= 3) {
        try {
          // Close the polygon by adding the first point at the end
          const coordinates = [...newPoints.map(p => p.coordinates), newPoints[0].coordinates];
          const polygonGeometry = createPolygon([coordinates]);
          
          newPolygon = {
            type: 'Polygon',
            coordinates: polygonGeometry.coordinates,
          };
          
          isComplete = newPoints.length >= 3;
        } catch (error) {
          console.warn('Failed to create polygon:', error);
        }
      }

      return {
        points: newPoints,
        polygon: newPolygon,
        isDrawing: newPoints.length > 0 && !isComplete,
        isComplete,
      };
    });
  }, [mode]);

  // Clear the current AOI
  const clearAoi = useCallback(() => {
    setAoi({
      points: [],
      polygon: null,
      isDrawing: false,
      isComplete: false,
    });
  }, []);

  // Complete the current AOI (if possible)
  const completeAoi = useCallback(() => {
    setAoi(prev => {
      if (prev.points.length >= 3) {
        return {
          ...prev,
          isDrawing: false,
          isComplete: true,
        };
      }
      return prev;
    });
  }, []);

  // Create GeoJSON source for the AOI
  const sourceProps: DatasetSource = useMemo(() => {
    const features = [];

    // Add point features
    aoi.points.forEach(aoiPoint => {
      features.push({
        type: 'Feature' as const,
        id: aoiPoint.id,
        geometry: createPoint(aoiPoint.coordinates),
        properties: {
          type: 'aoi-point',
          id: aoiPoint.id,
        },
      });
    });

    // Add polygon feature if available
    if (aoi.polygon) {
      features.push({
        type: 'Feature' as const,
        id: 'aoi-polygon',
        geometry: aoi.polygon,
        properties: {
          type: 'aoi-polygon',
        },
      });
    }

    // Add line feature for drawing state
    if (aoi.points.length >= 2) {
      const lineCoordinates = aoi.points.map(p => p.coordinates);
      if (aoi.isDrawing) {
        // Add line back to first point to show potential closure
        lineCoordinates.push(aoi.points[0].coordinates);
      }
      
      features.push({
        type: 'Feature' as const,
        id: 'aoi-line',
        geometry: {
          type: 'LineString',
          coordinates: lineCoordinates,
        },
        properties: {
          type: 'aoi-line',
        },
      });
    }

    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection' as const,
        features,
      } as any,
    };
  }, [aoi]);

  // Layer configurations
  const layers = useMemo(() => {
    const pointLayer: DatasetLayer = {
      id: 'aoi-points',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#FF6B6B',
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2,
        'circle-opacity': 0.8,
      },
      layout: {},
      filter: ['==', ['get', 'type'], 'aoi-point'],
    };

    const polygonLayer: DatasetLayer = {
      id: 'aoi-polygon',
      type: 'fill',
      paint: {
        'fill-color': '#4ECDC4',
        'fill-opacity': 0.3,
        'fill-outline-color': '#4ECDC4',
      },
      layout: {},
      filter: ['==', ['get', 'type'], 'aoi-polygon'],
    };

    const lineLayer: DatasetLayer = {
      id: 'aoi-line',
      type: 'line',
      paint: {
        'line-color': aoi.isDrawing ? '#FFE66D' : '#4ECDC4',
        'line-width': 2,
        'line-opacity': 0.8,
        'line-dasharray': aoi.isDrawing ? [2, 2] : undefined,
      },
      layout: {},
      filter: ['==', ['get', 'type'], 'aoi-line'],
    };

    return {
      points: pointLayer,
      polygon: polygonLayer,
      line: lineLayer,
    };
  }, [aoi.isDrawing]);

  return {
    aoi,
    sourceProps,
    layers,
    handleMapClick,
    clearAoi,
    completeAoi,
    setMode,
    mode,
  };
}
