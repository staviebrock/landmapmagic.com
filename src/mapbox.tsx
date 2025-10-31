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
import React, { useEffect, useRef, useState } from 'react';
import { useLandMaps } from './react/useLandMaps.js';
import { installPmtilesProtocolMapbox } from './core/pmtilesProtocol.js';
import type { LandMapProps, ClickInfoConfig } from './core/types.js';
import { ClickInfo } from './react/ClickInfo.js';


// Default map style - ESRI World Imagery satellite basemap
// Users can override this via the style prop
const getDefaultMapStyle = (): object => {
  return {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      }
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  };
};

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
  apiKey = 'dev',
  baseApiUrl: apiUrl,
  initialCenter = [-98.5795, 39.8283], // Geographic center of US
  initialZoom = 4,
  style = DEFAULT_MAP_STYLE,
  availableLayers = ['clu'],
  initialVisibleLayers = [],
  showLegend = true,
  showClickInfo = true,
  className = '',
  height = '500px',
  width = '100%',
  borderColor,
  fillColor,
}: LandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());

  const { ssurgo, cdl, plss, clu, states } = useLandMaps(apiKey, apiUrl, undefined, undefined, borderColor, fillColor);

  // Track which layers are currently visible
  const [dataLayers, setDataLayers] = useState<string[]>(initialVisibleLayers);
  
  // Click info state
  const [clickInfo, setClickInfo] = useState<{
    x: number;
    y: number;
    properties: Record<string, any>;
    config: ClickInfoConfig;
  } | null>(null);

  // Toggle layer visibility - ONLY use setLayoutProperty to avoid map flickering
  const toggleLayerVisibility = (datasetKey: string) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const isCurrentlyVisible = dataLayers.includes(datasetKey);
    const datasets = { ssurgo, cdl, plss, clu };
    const dataset = datasets[datasetKey as keyof typeof datasets];

    if (dataset) {
      // Update visibility for all layers in this dataset
      Object.keys(dataset.layers).forEach(layerKey => {
        const layerId = `${dataset.id}-${layerKey}`;
        
        if (map.getLayer(layerId)) {
          try {
            const newVisibility = !isCurrentlyVisible ? 'visible' : 'none';
            map.setLayoutProperty(layerId, 'visibility', newVisibility);
            console.log(`Layer visibility changed: ${layerId} -> ${newVisibility}`);
          } catch (error) {
            console.error(`Error changing visibility for layer ${layerId}:`, error);
          }
        }
      });
    }

    // Update dataLayers state
    if (isCurrentlyVisible) {
      // Remove from array
      setDataLayers(prev => prev.filter(layer => layer !== datasetKey));
    } else {
      // Add to array
      setDataLayers(prev => [...prev, datasetKey]);
    }

    console.log(`${dataset?.name} ${!isCurrentlyVisible ? 'shown' : 'hidden'}`);
  };

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
          // Add only available land datasets (we'll control visibility via props and legend)
          const datasets = { ssurgo, cdl, plss, clu, states };
          
          console.log('Adding available datasets:', availableLayers);
          
          Object.entries(datasets).forEach(([datasetKey, dataset]) => {
            // Only add if this layer is in availableLayers
            if (!availableLayers.includes(datasetKey as any)) {
              console.log(`Skipping dataset ${dataset.id} - not in availableLayers`);
              return;
            }
            
            console.log(`Adding dataset: ${dataset.id}`, dataset.sourceProps);
            
            // Add source
            if (!map.getSource(dataset.id)) {
              try {
                map.addSource(dataset.id, dataset.sourceProps as any);
                sourcesAddedRef.current.add(dataset.id);
                console.log(`✅ Source added: ${dataset.id}`);
              } catch (error) {
                console.error(`❌ Error adding source ${dataset.id}:`, error);
              }
            }
            
            // Add ALL layers but set visibility based on dataLayers array
            Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
              const layerId = `${dataset.id}-${layerKey}`;
              if (!map.getLayer(layerId)) {
                try {
                  const isVisible = dataLayers.includes(datasetKey as any);
                  const layerSpec = {
                    ...layerConfig,
                    id: layerId,
                    source: dataset.id,
                    layout: {
                      ...layerConfig.layout,
                      visibility: isVisible ? 'visible' : 'none',
                    },
                  };
                  console.log(`Adding layer ${layerId} with config:`, layerSpec);
                  map.addLayer(layerSpec as any);
                  console.log(`✅ Layer added: ${layerId} (visibility: ${isVisible ? 'visible' : 'none'})`);
                } catch (error) {
                  console.error(`❌ Error adding layer ${layerId}:`, error);
                }
              }
            });
          });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle map click events for feature info
  useEffect(() => {
    if (!mapRef.current || !showClickInfo) return;

    const map = mapRef.current;
    const datasets = { ssurgo, cdl, plss, clu };

    const handleMapClick = (e: any) => {
      // Query all visible layers for features at the click point
      const features = map.queryRenderedFeatures(e.point);
      
      if (features.length > 0) {
        // Find the first feature that has a corresponding click info config
        for (const feature of features) {
          const layerId = feature.layer.id;
          
          // Find which dataset this layer belongs to
          for (const [datasetKey, dataset] of Object.entries(datasets)) {
            // Skip if not in available layers
            if (!availableLayers.includes(datasetKey as any)) continue;
            
            if (dataset.clickInfoConfig && 
                dataset.clickInfoConfig.layerIds && 
                dataset.clickInfoConfig.layerIds.includes(layerId)) {
              
              // Check if this layer is currently visible
              if (dataLayers.includes(datasetKey)) {
                setClickInfo({
                  x: e.point.x,
                  y: e.point.y,
                  properties: feature.properties,
                  config: dataset.clickInfoConfig
                });
                return; // Stop at first match
              }
            }
          }
        }
      }
      
      // If no features found or clicked outside, close any open popup
      setClickInfo(null);
    };

    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
    };
  }, [showClickInfo, dataLayers, availableLayers]); // Re-attach handler when these change

  // Handle click outside to close popup
  useEffect(() => {
    if (!showClickInfo || !clickInfo) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside the popup (not on the popup itself or its children)
      const popupElement = document.querySelector('[data-click-info-popup]');
      if (popupElement && !popupElement.contains(target)) {
        setClickInfo(null);
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClickInfo, clickInfo]);

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
      
      {/* Legend */}
      {showLegend && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '13px',
            minWidth: '180px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            Map Layers
          </h4>
          
          {availableLayers.map(datasetKey => {
            const datasets = { ssurgo, cdl, plss, clu };
            const dataset = datasets[datasetKey as keyof typeof datasets];
            
            if (!dataset) return null;
            
            const isVisible = dataLayers.includes(datasetKey);
            
            // Dataset color mapping
            const getDatasetColor = (id: string) => {
              switch (id) {
                case 'ssurgo': return '#2E8B57'; // SeaGreen for soil data
                case 'cdl': return '#FFD700'; // Gold for crop data
                case 'plss': return '#4A90E2'; // Blue for survey data
                case 'clu': return '#FF6B35'; // Orange for field boundaries
                default: return '#95A5A6'; // Gray fallback
              }
            };
            
            return (
              <div
                key={dataset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  border: '1px solid transparent',
                }}
                onClick={() => toggleLayerVisibility(datasetKey)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleLayerVisibility(datasetKey)}
                  style={{
                    marginRight: '10px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Dataset color indicator */}
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    marginRight: '8px',
                    borderRadius: '2px',
                    backgroundColor: getDatasetColor(dataset.id),
                    opacity: isVisible ? 1 : 0.3,
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                />
                
                <span style={{ 
                  color: isVisible ? '#333' : '#999',
                  fontSize: '13px',
                  fontWeight: '500',
                  userSelect: 'none',
                }}>
                  {dataset.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Click Info Popup */}
      {showClickInfo && clickInfo && (
        <ClickInfo
          x={clickInfo.x}
          y={clickInfo.y}
          properties={clickInfo.properties}
          clickInfoConfig={clickInfo.config}
          visible={true}
          onClose={() => setClickInfo(null)}
        />
      )}
    </div>
  );
}

// Default export for convenience
export default LandMap;
