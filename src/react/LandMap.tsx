import React, { useEffect, useRef, useState } from 'react';
import { useLandMaps } from './useLandMaps.js';
import { installPmtilesProtocolMapLibre } from '../core/pmtilesProtocol.js';
import type { LandMapProps } from '../core/types.js';


// Default map style from environment (required at build time)
const getDefaultMapStyle = (): string => {
  const styleUrl = process.env.REACT_APP_MAP_STYLE_URL;
  console.log('Map style URL from environment:', styleUrl);
  return styleUrl || 'https://demotiles.maplibre.org/style.json'; // fallback style
};

const DEFAULT_MAP_STYLE = getDefaultMapStyle();

// Dynamic imports to avoid bundling map libraries
const loadMapLibre = async () => {
  try {
    const maplibregl = await import('maplibre-gl');
    return maplibregl.default || maplibregl;
  } catch (error) {
    console.error('Failed to load MapLibre GL JS:', error);
    throw new Error('MapLibre GL JS is required but not installed. Please install maplibre-gl.');
  }
};

/**
 * Drop-in map component with land datasets
 * Uses MapLibre GL JS by default
 */
export function LandMap({
  initialCenter = [-98.5795, 39.8283], // Geographic center of US
  initialZoom = 4,
  style = DEFAULT_MAP_STYLE,
  showDatasets = ['plss', 'ssurgo'],
  showLegend = true,
  className = '',
  height = '500px',
  width = '100%',
}: LandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());

  const { ssurgo, cdl, plss } = useLandMaps();

  // Simple dataset visibility state - like the working example
  const [datasetVisibility, setDatasetVisibility] = useState<Record<string, boolean>>({
    ssurgo: true,
    cdl: true,
    plss: true,
  });

  // Simple toggle function - directly update map layers
  const toggleDatasetVisibility = (datasetKey: string) => {
    if (!mapRef.current) return;

    const newVisibility = !datasetVisibility[datasetKey];
    const datasets = { ssurgo, cdl, plss };
    const dataset = datasets[datasetKey as keyof typeof datasets];

    if (dataset) {
      // Update all layers for this dataset
      Object.keys(dataset.layers).forEach(layerKey => {
        const layerId = `${dataset.id}-${layerKey}`;
        if (mapRef.current!.getLayer(layerId)) {
          mapRef.current!.setLayoutProperty(
            layerId,
            'visibility',
            newVisibility ? 'visible' : 'none'
          );
        }
      });
    }

    // Update state
    setDatasetVisibility(prev => ({
      ...prev,
      [datasetKey]: newVisibility
    }));

    console.log(`${dataset?.name} ${newVisibility ? 'shown' : 'hidden'}`);
  };
  


  // Initialize map
  useEffect(() => {
    // Debug: Map initialization
    // console.log('Map initialization useEffect triggered');
    // console.log('mapContainerRef.current:', mapContainerRef.current);
    // console.log('mapRef.current:', mapRef.current);
    
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      console.log('Starting map initialization...');
      try {
        const maplibregl = await loadMapLibre();
        
        // Install PMTiles protocol with the loaded MapLibre instance
        installPmtilesProtocolMapLibre(maplibregl);

        console.log('Creating map with style:', style);
        console.log('Map container:', mapContainerRef.current);

        // Create map instance
        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: style as any,
          center: initialCenter,
          zoom: initialZoom,
        });

        console.log('Map instance created successfully:', map);

        mapRef.current = map;

        console.log('Map instance created, waiting for load event...');

        // Add error handlers
        map.on('error', (e: any) => {
          console.error('Map error:', e);
        });

        map.on('styleimagemissing', (e: any) => {
          console.warn('Style image missing:', e);
        });

        map.on('sourcedata', (e: any) => {
          if (e.isSourceLoaded) {
            console.log(`Source loaded: ${e.sourceId}`);
          }
        });

        map.on('sourcedataloading', (e: any) => {
          console.log(`Source loading: ${e.sourceId}`);
        });

        // Wait for map to load
        map.on('load', () => {
          console.log('Map load event fired!');
          // Add ALL land datasets (we'll control visibility via props and legend)
          const datasets = { ssurgo, cdl, plss };
          
          console.log('Adding all datasets:', Object.keys(datasets));
          
          Object.entries(datasets).forEach(([datasetKey, dataset]) => {
            console.log(`Adding dataset: ${dataset.id}`, dataset.sourceProps);
            
            // Add source
            if (!map.getSource(dataset.id)) {
              try {
                map.addSource(dataset.id, dataset.sourceProps as any);
                sourcesAddedRef.current.add(dataset.id);
                console.log(`Source added: ${dataset.id}`);
              } catch (error) {
                console.error(`Error adding source ${dataset.id}:`, error);
              }
            }
            
            // Add layers with visibility based on showDatasets and datasetVisibility
            Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
              const layerId = `${dataset.id}-${layerKey}`;
              if (!map.getLayer(layerId)) {
                try {
                  // Visible if: dataset is in showDatasets AND visible in state
                  const isInShowDatasets = showDatasets.includes(datasetKey as any);
                  const isVisibleInState = datasetVisibility[datasetKey];
                  const visibility = (isInShowDatasets && isVisibleInState) ? 'visible' : 'none';
                  
                  map.addLayer({
                    ...layerConfig,
                    id: layerId,
                    source: dataset.id,
                    layout: {
                      ...layerConfig.layout,
                      visibility,
                    },
                  } as any);
                  console.log(`Layer added: ${layerId} (visibility: ${visibility})`);
                } catch (error) {
                  console.error(`Error adding layer ${layerId}:`, error);
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
  }, [style, initialCenter, initialZoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update layer visibility when showDatasets changes (NO map reload)
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const datasets = { ssurgo, cdl, plss };

    Object.entries(datasets).forEach(([datasetKey, dataset]) => {
      Object.keys(dataset.layers).forEach(layerKey => {
        const layerId = `${dataset.id}-${layerKey}`;
        
        if (map.getLayer(layerId)) {
          // Visible if: dataset is in showDatasets AND visible in state
          const isInShowDatasets = showDatasets.includes(datasetKey as any);
          const isVisibleInState = datasetVisibility[datasetKey];
          const visibility = (isInShowDatasets && isVisibleInState) ? 'visible' : 'none';
          
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    });
  }, [showDatasets]);


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
          
          {showDatasets.map(datasetKey => {
            const datasets = { ssurgo, cdl, plss };
            const dataset = datasets[datasetKey];
            
            if (!dataset) return null;
            
            const isVisible = datasetVisibility[datasetKey];
            
            // Dataset color mapping
            const getDatasetColor = (id: string) => {
              switch (id) {
                case 'ssurgo': return '#2E8B57'; // SeaGreen for soil data
                case 'cdl': return '#FFD700'; // Gold for crop data
                case 'plss': return '#4A90E2'; // Blue for survey data
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
                onClick={() => toggleDatasetVisibility(datasetKey)}
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
                  onChange={() => toggleDatasetVisibility(datasetKey)}
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
    </div>
  );
}
