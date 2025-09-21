import React, { useEffect, useRef, useState } from 'react';
import { useLandMaps } from './useLandMaps.js';
import { installPmtilesProtocolMapLibre } from '../core/pmtilesProtocol.js';
import type { LandMapProps } from '../core/types.js';
import { getDefaultMapStyle, loadMapLibre } from './utils.js';

export function LandMap({
  initialCenter = [-98.5795, 39.8283], // Geographic center of US
  initialZoom = 4,
  style =  getDefaultMapStyle(),
  layers = ['plss', 'ssurgo'],
  showLegend = true,
  className = '',
  height = '500px',
  width = '100%',
}: LandMapProps) {

  const [dataLayers, setDataLayers] = useState<string[]>(layers);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());

  const { ssurgo, cdl, plss } = useLandMaps();

  // Toggle function - ONLY use setLayoutProperty to avoid map flickering
  const toggleLayerVisibility = (datasetKey: string) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const isCurrentlyVisible = dataLayers.includes(datasetKey);
    const datasets = { ssurgo, cdl, plss };
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
      console.log('Starting map initialization...');
      try {
        const maplibregl = await loadMapLibre();
        
        // Install PMTiles protocol with the loaded MapLibre instance
        installPmtilesProtocolMapLibre(maplibregl);
        // Create map instance
        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: style as any,
          center: initialCenter,
          zoom: initialZoom,
        });


        mapRef.current = map;

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
            
            // Add ALL layers but set visibility based on dataLayers array
            Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
              const layerId = `${dataset.id}-${layerKey}`;
              if (!map.getLayer(layerId)) {
                try {
                  const isVisible = dataLayers.includes(datasetKey as any);
                  map.addLayer({
                    ...layerConfig,
                    id: layerId,
                    source: dataset.id,
                    layout: {
                      ...layerConfig.layout,
                      visibility: isVisible ? 'visible' : 'none',
                    },
                  } as any);
                  console.log(`Layer added: ${layerId} (visibility: ${isVisible ? 'visible' : 'none'})`);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // No conflicting useEffect - layer management is handled only by toggle function


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
          
          {Object.keys({ ssurgo, cdl, plss }).map(datasetKey => {
            const datasets = { ssurgo, cdl, plss };
            const dataset = datasets[datasetKey as keyof typeof datasets];
            
            if (!dataset) return null;
            
            const isVisible = dataLayers.includes(datasetKey);
            
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
    </div>
  );
}
