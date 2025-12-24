import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLandMaps } from './useLandMaps.js';
import type { LandMapProps, ClickInfoConfig, SearchResult } from '../core/types.js';
import { getDefaultMapStyle, loadMapLibre } from './utils.js';
import { ClickInfo } from './ClickInfo.js';
import { DEFAULT_WORKER_ENDPOINT } from '../core/utils.js';
// import { AOIDrawer } from './AOIDrawer.js';
// import { AOIQuery, type AOIQueryResult } from './AOIQuery.js';
// import { AOIResults } from './AOIResults.js';
// import type { Feature, Polygon } from 'geojson';

export function LandMap({
  apiKey = 'dev',
  baseApiUrl: apiUrl,
  initialCenter = [-98.5795, 39.8283], // Geographic center of US
  initialZoom = 4,
  style =  getDefaultMapStyle(),
  availableLayers = ['states', 'counties', 'townships', 'sections', 'clu'],
  initialVisibleLayers = [],
  showLegend = true,
  showClickInfo = true,
  showSearch = true,
  className = '',
  height = '500px',
  width = '100%',
  borderColor,
}: LandMapProps) {

  const [dataLayers, setDataLayers] = useState<string[]>(initialVisibleLayers);
  // const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  
  // Click info state
  const [clickInfo, setClickInfo] = useState<{
    x: number;
    y: number;
    properties: Record<string, any>;
    config: ClickInfoConfig;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // AOI state
  const [showAOITool] = useState(false);
  // const [currentAOI, setCurrentAOI] = useState<Feature<Polygon> | null>(null);
  // const [aoiResults, setAOIResults] = useState<AOIQueryResult[]>([]);
  // const [showAOIResults, setShowAOIResults] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());

  const { ssurgo, cdl, plss, clu, states, counties, townships, sections } = useLandMaps(apiKey, apiUrl, borderColor);

  // AOI handlers
  // const handleAOIComplete = (aoi: Feature<Polygon>) => {
  //   setCurrentAOI(aoi);
  //   setShowAOIResults(true);
  // };

  // const handleAOIChange = (aoi: Feature<Polygon> | null) => {
  //   setCurrentAOI(aoi);
  //   if (!aoi) {
  //     setAOIResults([]);
  //     setShowAOIResults(false);
  //   }
  // };

  // const handleAOIResults = (results: AOIQueryResult[]) => {
  //   setAOIResults(results);
  // };

  // const toggleAOITool = () => {
  //   const newState = !showAOITool;
  //   setShowAOITool(newState);
    
  //   if (newState) {
  //     // Close click info when opening AOI tool
  //     setClickInfo(null);
  //   }
    
  //   if (showAOITool) {
  //     // Clean up when closing
  //     setCurrentAOI(null);
  //     // setAOIResults([]);
  //     setShowAOIResults(false);
  //   }
  // };

  // Toggle function - ONLY use setLayoutProperty to avoid map flickering
  const toggleLayerVisibility = (datasetKey: string) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const isCurrentlyVisible = dataLayers.includes(datasetKey);
    const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };
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

  // Search functions
  const baseUrl = apiUrl || DEFAULT_WORKER_ENDPOINT;

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${baseUrl}/v1/data/search?q=${encodeURIComponent(query)}&limit=5&key=${apiKey}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [baseUrl, apiKey]);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Debounce search
    searchDebounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  const selectSearchResult = useCallback((result: SearchResult) => {
    setSearchQuery(result.simpleName);
    setShowResults(false);

    if (!mapRef.current) return;
    const map = mapRef.current;

    // Fly to result
    if (result.bbox) {
      // Use fitBounds for bbox
      const [minLng, minLat, maxLng, maxLat] = result.bbox;
      map.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 50, duration: 1500 }
      );
    } else if (result.centroid) {
      // Use flyTo for centroid
      map.flyTo({
        center: result.centroid,
        zoom: result.suggestedZoom || 12,
        duration: 1500
      });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      console.log('Starting map initialization...');
      try {
        const maplibregl = await loadMapLibre();
        
        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: style as any,
          center: initialCenter,
          zoom: initialZoom,
        });


        mapRef.current = map;

        let hoveredFeatureId: string | number | null = null;
        const clearHoverState = () => {
          if (hoveredFeatureId !== null) {
            try {
              map.setFeatureState(
                { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
                { hover: false }
              );
            } catch (err) {
              console.warn('Failed to clear CLU hover state:', err);
            }
            hoveredFeatureId = null;
          }
          map.getCanvas().style.cursor = '';
        };

        const handleHoverMove = (e: any) => {
          if (!e.features?.length) {
            clearHoverState();
            return;
          }

          const feature = e.features[0];
          const featureId = feature.id;

          if (featureId === undefined || featureId === null) {
            clearHoverState();
            return;
          }

          if (hoveredFeatureId !== featureId) {
            clearHoverState();
            try {
              map.setFeatureState(
                {
                  source: feature.source || 'clu',
                  sourceLayer: feature.sourceLayer || 'clu',
                  id: featureId,
                },
                { hover: true }
              );
              hoveredFeatureId = featureId;
            } catch (err) {
              console.warn('Failed to set CLU hover state:', err);
            }
          }

          map.getCanvas().style.cursor = 'pointer';
        };

        const handleHoverLeave = () => {
          clearHoverState();
        };

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

        // Track zoom changes
        // map.on('zoom', () => {
        //   const zoom = map.getZoom();
        //   setCurrentZoom(Math.round(zoom * 10) / 10); // Round to 1 decimal place
        // });

        // Wait for map to load
        map.on('load', () => {
          console.log('Map load event fired!');
          // Set initial zoom level
          // setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
          
          // Add only available land datasets (we'll control visibility via props and legend)
          const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };
          
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
                console.log(`Adding source ${dataset.id} with config:`, dataset.sourceProps);
                map.addSource(dataset.id, dataset.sourceProps as any);
                sourcesAddedRef.current.add(dataset.id);
                console.log(`✅ Source added: ${dataset.id}`);
              } catch (error) {
                console.error(`❌ Error adding source ${dataset.id}:`, error);
                console.error('Source config was:', dataset.sourceProps);
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
                  console.error('Layer config was:', layerConfig);
                  console.error('Dataset source:', dataset.sourceProps);
                }
              }
            });
          });

          map.on('mousemove', 'clu-outline', handleHoverMove);
          map.on('mouseleave', 'clu-outline', handleHoverLeave);
          clearHoverState();
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
    const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };

    const handleMapClick = (e: any) => {
      // Don't show click info when AOI tool is active
      if (showAOITool) {
        setClickInfo(null);
        return;
      }

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
  }, [showClickInfo, dataLayers, showAOITool, availableLayers]); // Re-attach handler when these change

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

  // Handle click outside to close search results
  useEffect(() => {
    if (!showResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const searchContainer = target.closest('[data-search-container]');
      if (!searchContainer) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

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

      {/* Search Box */}
      {showSearch && (
        <div
          data-search-container
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            gap: '8px',
            width: '320px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInput}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search states, counties, townships..."
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
            }}
          />
          {/* Spinner */}
          {isSearching && (
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
          {/* Results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '8px',
                right: '8px',
                marginTop: '4px',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {searchResults.map((result, index) => (
                <div
                  key={result.id || index}
                  onClick={() => selectSearchResult(result)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                    {result.simpleName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {result.type} • {result.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Spinner keyframes style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Legend */}
      {showLegend && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '12px',
            // minWidth: '180px',
          }}
        >
          {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> */}
            {/* <h4 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              Map Layers
            </h4> */}
            {/* <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              backgroundColor: '#f8f9fa',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '1px solid #e9ecef',
              fontWeight: '500'
            }}>
              Zoom: {currentZoom}
            </div> */}
          {/* </div> */}
          
          {/* AOI Tool Button */}
          {/* <button
            onClick={toggleAOITool}
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: '12px',
              backgroundColor: showAOITool ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showAOITool) {
                e.currentTarget.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseLeave={(e) => {
              if (!showAOITool) {
                e.currentTarget.style.backgroundColor = '#007bff';
              }
            }}
          >
            {showAOITool ? '✓ AOI Tool Active' : '📐 AOI Query Tool'}
          </button> */}
          
          {availableLayers.map(datasetKey => {
            const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };
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
                case 'states': return '#4A90E2'; // Blue for state boundaries
                case 'counties': return '#8B7355'; // Brown for county boundaries
                case 'townships': return '#228B22'; // Forest green for townships
                case 'sections': return '#DC143C'; // Crimson red for sections
                default: return '#95A5A6'; // Gray fallback
              }
            };
            
            return (
              <div
                key={dataset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px',
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
                    marginRight: '8px',
                    cursor: 'pointer',
                    accentColor: getDatasetColor(dataset.id), // Use dataset color for checkbox
                    transform: 'scale(1.2)', // Make it slightly larger
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <span style={{ 
                  // color: isVisible ? '#333' : '#999',
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

      {/* AOI Drawing Tool */}
      {/* <AOIDrawer
        map={mapRef.current}
        onAOIComplete={handleAOIComplete}
        onAOIChange={handleAOIChange}
        isActive={showAOITool}
        onToggle={toggleAOITool}
      /> */}

      {/* AOI Query Logic */}
      {/* <AOIQuery
        map={mapRef.current}
        aoi={currentAOI}
        datasets={Object.fromEntries(
          availableLayers.map(key => [key, { ssurgo, cdl, plss, clu, states }[key]])
        )}
        enabled={showAOITool && currentAOI !== null}
        maxFeatures={500}
        maxAcres={1000}
        minZoom={14}
        onResults={handleAOIResults}
        onError={(error) => console.warn('AOI Query Error:', error)}
      /> */}

      {/* AOI Results Display */}
      {/* {showAOIResults && (
        <AOIResults
          results={aoiResults}
          aoi={currentAOI}
          onClose={() => setShowAOIResults(false)}
        />
      )} */}
    </div>
  );
}
