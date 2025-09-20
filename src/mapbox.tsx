// Re-export all React hooks and components
export * from './react/index.js';

// Re-export core utilities (except MapLibre-specific ones)
export * from './core/types.js';
export * from './core/makeVectorDataset.js';

// Mapbox-specific exports
export { 
  MapboxPmtilesProtocol as InstallPmtilesProtocol,
  installPmtilesProtocolMapbox as installPmtilesProtocol,
} from './core/pmtilesProtocol.js';

// Create a Mapbox-specific LandMap component
import React, { useEffect, useRef } from 'react';
import { useLandMaps } from './react/useLandMaps.js';
import { useAoiDraw } from './react/useAoiDraw.js';
import { useAoiQuery } from './react/useAoiQuery.js';
import { installPmtilesProtocolMapbox } from './core/pmtilesProtocol.js';
import type { LandMapProps } from './core/types.js';

// Default API endpoint from environment or fallback
const getDefaultApiEndpoint = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_LANDMAP_API_ENDPOINT || '/api/aoi/summary';
  }
  return '/api/aoi/summary';
};

// Default map style from environment (required at build time)
const getDefaultMapStyle = (): string => {
  return process.env.REACT_APP_MAP_STYLE_URL!;
};

const DEFAULT_API_ENDPOINT = getDefaultApiEndpoint();
const DEFAULT_MAP_STYLE = getDefaultMapStyle();

// Dynamic import for Mapbox GL JS
const loadMapbox = async () => {
  try {
    const mapboxgl = await import('mapbox-gl');
    return mapboxgl.default || mapboxgl;
  } catch (error) {
    console.error('Failed to load Mapbox GL JS:', error);
    throw new Error('Mapbox GL JS is required but not installed. Please install mapbox-gl.');
  }
};

/**
 * Mapbox-specific LandMap component
 * Similar to the base LandMap but uses Mapbox GL JS instead of MapLibre
 */
export function LandMap({
  apiEndpoint = DEFAULT_API_ENDPOINT,
  initialCenter = [-98.5795, 39.8283], // Geographic center of US
  initialZoom = 4,
  style = DEFAULT_MAP_STYLE,
  onAoiResult,
  onAoiChange,
  aoiMode = 'draw',
  showDatasets = ['ssurgo', 'cdl', 'plss'],
  className = '',
  height = '500px',
  width = '100%',
}: LandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());

  const { ssurgo, cdl, plss } = useLandMaps();
  const aoiDraw = useAoiDraw(aoiMode);
  
  const { data: aoiResult, error: aoiError } = useAoiQuery(
    aoiDraw.aoi.polygon,
    { endpoint: apiEndpoint },
    1000 // 1 second debounce
  );

  // Handle AOI result
  useEffect(() => {
    if (aoiResult) {
      console.log('AOI Query Result:', aoiResult);
      onAoiResult?.(aoiResult);
    }
    if (aoiError) {
      console.error('AOI Query Error:', aoiError);
    }
  }, [aoiResult, aoiError, onAoiResult]);

  // Handle AOI change
  useEffect(() => {
    onAoiChange?.(aoiDraw.aoi);
  }, [aoiDraw.aoi, onAoiChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = await loadMapbox();
        
        // Install PMTiles protocol for Mapbox
        installPmtilesProtocolMapbox(mapboxgl);

        // Create map instance
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: style as any,
          center: initialCenter,
          zoom: initialZoom,
        });

        mapRef.current = map;

        // Wait for map to load
        map.on('load', () => {
          // Add land datasets
          const datasets = { ssurgo, cdl, plss };
          
          showDatasets.forEach(datasetKey => {
            if (datasets[datasetKey]) {
              const dataset = datasets[datasetKey];
              
              // Add source
              if (!map.getSource(dataset.id)) {
                map.addSource(dataset.id, dataset.sourceProps as any);
                sourcesAddedRef.current.add(dataset.id);
              }

              // Add layers
              Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
                const layerId = `${dataset.id}-${layerKey}`;
                if (!map.getLayer(layerId)) {
                  map.addLayer({
                    ...layerConfig,
                    id: layerId,
                    source: dataset.id,
                  } as any);
                }
              });
            }
          });

          // Add AOI source and layers
          if (!map.getSource('aoi')) {
            map.addSource('aoi', aoiDraw.sourceProps as any);
            sourcesAddedRef.current.add('aoi');

            // Add AOI layers
            Object.entries(aoiDraw.layers).forEach(([layerKey, layerConfig]) => {
              const layerId = `aoi-${layerKey}`;
              if (!map.getLayer(layerId)) {
                map.addLayer({
                  ...layerConfig,
                  id: layerId,
                  source: 'aoi',
                } as any);
              }
            });
          }
        });

        // Handle map clicks for AOI drawing
        map.on('click', (e: any) => {
          if (aoiDraw.mode === 'draw') {
            aoiDraw.handleMapClick({
              lngLat: [e.lngLat.lng, e.lngLat.lat],
            });
          }
        });

        // Change cursor on hover for drawing mode
        map.on('mouseenter', () => {
          if (aoiDraw.mode === 'draw') {
            map.getCanvas().style.cursor = 'crosshair';
          }
        });

        map.on('mouseleave', () => {
          map.getCanvas().style.cursor = '';
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        sourcesAddedRef.current.clear();
      }
    };
  }, [style, initialCenter, initialZoom, showDatasets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update AOI source when AOI changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.getSource('aoi')) {
      const source = mapRef.current.getSource('aoi');
      if (source && source.setData) {
        source.setData(aoiDraw.sourceProps.data);
      }
    }
  }, [aoiDraw.sourceProps]);

  // Update cursor style based on mode
  useEffect(() => {
    if (mapRef.current) {
      const canvas = mapRef.current.getCanvas();
      canvas.style.cursor = aoiDraw.mode === 'draw' ? 'crosshair' : '';
    }
  }, [aoiDraw.mode]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
  };

  return (
    <div className={className} style={containerStyle}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* AOI Controls */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '8px',
          fontSize: '14px',
        }}
      >
        <button
          onClick={() => aoiDraw.setMode('draw')}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: aoiDraw.mode === 'draw' ? '#4ECDC4' : 'white',
            color: aoiDraw.mode === 'draw' ? 'white' : 'black',
            cursor: 'pointer',
          }}
        >
          Draw
        </button>
        <button
          onClick={() => aoiDraw.setMode('view')}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: aoiDraw.mode === 'view' ? '#4ECDC4' : 'white',
            color: aoiDraw.mode === 'view' ? 'white' : 'black',
            cursor: 'pointer',
          }}
        >
          View
        </button>
        <button
          onClick={aoiDraw.clearAoi}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: 'white',
            color: 'black',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Status indicator */}
      {aoiDraw.aoi.isComplete && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(76, 205, 196, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          AOI Complete • {aoiDraw.aoi.points.length} points
        </div>
      )}
    </div>
  );
}

// Default export for convenience
export default LandMap;
