import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as turf from '@turf/turf';
import type { Feature, Polygon, Position } from 'geojson';

export interface AOIDrawerProps {
  map: any;
  onAOIComplete?: (aoi: Feature<Polygon>) => void;
  onAOIChange?: (aoi: Feature<Polygon> | null) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function AOIDrawer({ 
  map, 
  onAOIComplete, 
  onAOIChange, 
  isActive, 
  onToggle 
}: AOIDrawerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Position[]>([]);
  const drawingRef = useRef<{
    points: Position[];
    markers: any[];
    tempLine: string | null;
  }>({
    points: [],
    markers: [],
    tempLine: null
  });

  // Clean up drawing state
  const cleanupDrawing = () => {
    if (!map) return;

    // Remove temporary markers (now they're layer IDs)
    drawingRef.current.markers.forEach(pointId => {
      if (typeof pointId === 'string') {
        if (map.getLayer(pointId)) {
          map.removeLayer(pointId);
        }
        if (map.getSource(pointId)) {
          map.removeSource(pointId);
        }
      } else if (pointId && pointId.remove) {
        // Fallback for old DOM markers
        pointId.remove();
      }
    });
    drawingRef.current.markers = [];

    // Remove temporary line
    if (drawingRef.current.tempLine && map.getLayer(drawingRef.current.tempLine)) {
      map.removeLayer(drawingRef.current.tempLine);
      map.removeSource(drawingRef.current.tempLine);
    }
    drawingRef.current.tempLine = null;

    // Remove AOI layer if it exists
    if (map.getLayer('aoi-fill')) {
      map.removeLayer('aoi-fill');
    }
    if (map.getLayer('aoi-outline')) {
      map.removeLayer('aoi-outline');
    }
    if (map.getSource('aoi')) {
      map.removeSource('aoi');
    }

    drawingRef.current.points = [];
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  // Start drawing
  const startDrawing = () => {
    if (!map || isDrawing) return;
    
    cleanupDrawing();
    setIsDrawing(true);
    map.getCanvas().style.cursor = 'crosshair';
  };

  // Add point to drawing
  const addPoint = (lngLat: [number, number]) => {
    console.log('Adding point:', lngLat);
    const newPoints = [...drawingRef.current.points, lngLat];
    drawingRef.current.points = newPoints;
    setCurrentPoints(newPoints);

    // Add marker for this point using map layers instead of DOM markers
    try {
      // Create a point source for this marker
      const pointId = `drawing-point-${newPoints.length}`;
      
      // Remove existing point if it exists
      if (map.getLayer(pointId)) {
        map.removeLayer(pointId);
      }
      if (map.getSource(pointId)) {
        map.removeSource(pointId);
      }

      // Add point source
      map.addSource(pointId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: lngLat
          },
          properties: {}
        }
      });

      // Add point layer
      map.addLayer({
        id: pointId,
        type: 'circle',
        source: pointId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#ff0000',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Store the point ID for cleanup
      drawingRef.current.markers.push(pointId);
      
    } catch (error) {
      console.error('Error adding point marker:', error);
    }

    // Update temporary line if we have more than one point
    if (newPoints.length > 1) {
      updateTempLine(newPoints);
    }
  };

  // Update temporary line
  const updateTempLine = (points: Position[]) => {
    if (!map || points.length < 2) return;

    const lineId = 'temp-drawing-line';
    const lineData = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: points
      },
      properties: {}
    };

    // Remove existing temp line
    if (drawingRef.current.tempLine && map.getLayer(drawingRef.current.tempLine)) {
      map.removeLayer(drawingRef.current.tempLine);
      map.removeSource(drawingRef.current.tempLine);
    }

    // Add new temp line
    map.addSource(lineId, {
      type: 'geojson',
      data: lineData
    });

    map.addLayer({
      id: lineId,
      type: 'line',
      source: lineId,
      paint: {
        'line-color': '#ff0000',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });

    drawingRef.current.tempLine = lineId;
  };

  // Complete drawing (double-click or button)
  const completeDrawing = () => {
    if (!map || drawingRef.current.points.length < 3) {
      alert('Please draw at least 3 points to create an area');
      return;
    }

    // Close the polygon by adding the first point at the end
    const closedPoints = [...drawingRef.current.points, drawingRef.current.points[0]];
    
    // Create polygon feature
    const aoiFeature: Feature<Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [closedPoints]
      },
      properties: {
        area: turf.area({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [closedPoints]
          },
          properties: {}
        })
      }
    };

    // Add AOI to map
    displayAOI(aoiFeature);

    // Clean up drawing state
    cleanupDrawing();
    map.getCanvas().style.cursor = '';

    // Notify parent components
    onAOIComplete?.(aoiFeature);
    onAOIChange?.(aoiFeature);
  };

  // Display AOI on map
  const displayAOI = (aoi: Feature<Polygon>) => {
    if (!map) return;

    // Remove existing AOI
    if (map.getLayer('aoi-fill')) {
      map.removeLayer('aoi-fill');
    }
    if (map.getLayer('aoi-outline')) {
      map.removeLayer('aoi-outline');
    }
    if (map.getSource('aoi')) {
      map.removeSource('aoi');
    }

    // Add AOI source
    map.addSource('aoi', {
      type: 'geojson',
      data: aoi
    });

    // Add AOI fill layer
    map.addLayer({
      id: 'aoi-fill',
      type: 'fill',
      source: 'aoi',
      paint: {
        'fill-color': '#ff0000',
        'fill-opacity': 0.2
      }
    });

    // Add AOI outline layer
    map.addLayer({
      id: 'aoi-outline',
      type: 'line',
      source: 'aoi',
      paint: {
        'line-color': '#ff0000',
        'line-width': 2
      }
    });
  };

  // Clear AOI
  const clearAOI = () => {
    cleanupDrawing();
    onAOIChange?.(null);
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  };

  // Handle map clicks
  useEffect(() => {
    if (!map || !isActive) return;

    const handleClick = (e: any) => {
      console.log('Map clicked, isDrawing:', isDrawing, 'coordinates:', [e.lngLat.lng, e.lngLat.lat]);
      if (isDrawing) {
        addPoint([e.lngLat.lng, e.lngLat.lat]);
      }
    };

    const handleDoubleClick = (e: any) => {
      console.log('Map double-clicked, isDrawing:', isDrawing);
      if (isDrawing) {
        e.preventDefault();
        completeDrawing();
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDoubleClick);
    };
  }, [map, isActive, isDrawing]);

  // Cleanup on unmount or when inactive
  useEffect(() => {
    if (!isActive) {
      cleanupDrawing();
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    }
  }, [isActive, map]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '200px', // Position under the legend
        left: '10px', // Same left position as legend
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '13px',
        minWidth: '180px',
        maxWidth: '200px',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
          AOI Query Tool
        </h4>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#666',
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        {!isDrawing ? (
          <button
            onClick={startDrawing}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              marginRight: '8px'
            }}
          >
            Start Drawing
          </button>
        ) : (
          <div>
            <button
              onClick={completeDrawing}
              disabled={currentPoints.length < 3}
              style={{
                padding: '6px 12px',
                backgroundColor: currentPoints.length >= 3 ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPoints.length >= 3 ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                marginRight: '8px'
              }}
            >
              Complete ({currentPoints.length} points)
            </button>
          </div>
        )}
        
        <button
          onClick={clearAOI}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear
        </button>
      </div>

      {isDrawing && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
          <div style={{ fontSize: '11px', color: '#28a745', fontWeight: '500', marginBottom: '4px' }}>
            ✓ Drawing Mode Active
          </div>
          <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
            • Click map to add points<br />
            • Double-click to finish<br />
            • Zoom 14+ required<br />
            • Max 1000 acres
          </div>
        </div>
      )}
    </div>
  );
}
