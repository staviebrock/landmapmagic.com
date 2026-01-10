import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLandMaps } from './useLandMaps.js';
import type { LandMapProps, ClickInfoConfig, SearchResult, QueryToolType } from '../core/types.js';
import { getDefaultMapStyle, loadMapLibre } from './utils.js';
import { ClickInfo } from './ClickInfo.js';
import { DEFAULT_WORKER_ENDPOINT } from '../core/utils.js';
import { PointLookup } from './PointLookup.js';
import { AOIQueryWidget } from './AOIQueryWidget.js';
import { QueryToolsPanel } from './QueryToolsPanel.js';

// Layer hierarchy for zoom-based visibility
// Each layer becomes the "main" layer at certain zoom levels
// The previous layer becomes the "parent" layer with thicker lines
const LAYER_HIERARCHY = ['states', 'counties', 'townships', 'sections', 'clu'] as const;

// Zoom thresholds for each layer transition
// At these zoom levels, the layer becomes the "main" layer
const ZOOM_THRESHOLDS: Record<string, number> = {
  states: 0,      // States are main from zoom 0-5
  counties: 6,    // Counties become main at zoom 6
  townships: 10,  // Townships become main at zoom 10
  sections: 12,   // Sections become main at zoom 12
  clu: 14,        // CLU becomes main at zoom 14
};

/**
 * Determine which layers should be visible based on current zoom level
 * Returns { main: string | null, parent: string | null }
 */
function getVisibleLayers(zoom: number, enabledLayers: string[]): { main: string | null; parent: string | null } {
  // Find the "main" layer for current zoom (highest threshold that zoom meets)
  let mainLayer: string | null = null;
  let parentLayer: string | null = null;
  
  // Work through hierarchy to find main layer
  for (let i = LAYER_HIERARCHY.length - 1; i >= 0; i--) {
    const layer = LAYER_HIERARCHY[i];
    if (enabledLayers.includes(layer) && zoom >= ZOOM_THRESHOLDS[layer]) {
      mainLayer = layer;
      
      // Find parent layer (previous enabled layer in hierarchy)
      for (let j = i - 1; j >= 0; j--) {
        if (enabledLayers.includes(LAYER_HIERARCHY[j])) {
          parentLayer = LAYER_HIERARCHY[j];
          break;
        }
      }
      break;
    }
  }
  
  // If no main layer found but there are enabled layers, use the first one
  if (!mainLayer && enabledLayers.length > 0) {
    for (const layer of LAYER_HIERARCHY) {
      if (enabledLayers.includes(layer)) {
        mainLayer = layer;
        break;
      }
    }
  }
  
  return { main: mainLayer, parent: parentLayer };
}

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
  showQueryTools = false,
  availableQueryTools = ['point', 'aoi'],
  className = '',
  height = '500px',
  width = '100%',
  borderColor,
}: LandMapProps) {

  const [dataLayers, setDataLayers] = useState<string[]>(initialVisibleLayers);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  
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

  // Query tools state
  const [activeQueryTool, setActiveQueryTool] = useState<QueryToolType | null>(null);

  // AOI state (legacy - keeping for backwards compatibility)
  const [showAOITool] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const sourcesAddedRef = useRef<Set<string>>(new Set());
  const hoverStateRef = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const { ssurgo, cdl, plss, clu, states, counties, townships, sections } = useLandMaps(apiKey, apiUrl, borderColor);

  // Toggle function for legend checkboxes
  const toggleLayerVisibility = (datasetKey: string) => {
    setDataLayers(prev => {
      if (prev.includes(datasetKey)) {
        return prev.filter(layer => layer !== datasetKey);
      } else {
        return [...prev, datasetKey];
      }
    });
  };

  // Update map layer visibility based on zoom and enabled layers
  const updateLayerVisibility = useCallback((map: any, zoom: number, enabledLayers: string[]) => {
    const { main, parent } = getVisibleLayers(zoom, enabledLayers);
    const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };
    
    // Update visibility for each layer
    LAYER_HIERARCHY.forEach(layerKey => {
      const dataset = datasets[layerKey as keyof typeof datasets];
      if (!dataset) return;
      
      // Determine if this layer should be visible
      const shouldBeVisible = layerKey === main || layerKey === parent;
      
      // Update all sublayers for this dataset
      Object.keys(dataset.layers).forEach(sublayerKey => {
        const layerId = `${dataset.id}-${sublayerKey}`;
        
        if (map.getLayer(layerId)) {
          try {
            const currentVisibility = map.getLayoutProperty(layerId, 'visibility');
            const newVisibility = shouldBeVisible ? 'visible' : 'none';
            
            if (currentVisibility !== newVisibility) {
              map.setLayoutProperty(layerId, 'visibility', newVisibility);
            }
          } catch (error) {
            // Layer might not exist yet, ignore
          }
        }
      });
    });
    
    // Also handle CDL (raster layer) - keep it visible if in enabledLayers
    if (cdl && enabledLayers.includes('cdl')) {
      Object.keys(cdl.layers).forEach(sublayerKey => {
        const layerId = `${cdl.id}-${sublayerKey}`;
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
          } catch (error) {
            // Ignore
          }
        }
      });
    } else if (cdl) {
      Object.keys(cdl.layers).forEach(sublayerKey => {
        const layerId = `${cdl.id}-${sublayerKey}`;
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          } catch (error) {
            // Ignore
          }
        }
      });
    }
  }, [ssurgo, cdl, plss, clu, states, counties, townships, sections]);

  // Effect to update layer visibility when zoom or enabled layers change
  useEffect(() => {
    if (!mapRef.current) return;
    updateLayerVisibility(mapRef.current, currentZoom, dataLayers);
  }, [currentZoom, dataLayers, updateLayerVisibility]);

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

        // Clear any existing hover state
        const clearHoverState = () => {
          if (hoverStateRef.current) {
            try {
              map.setFeatureState(
                { 
                  source: hoverStateRef.current.source, 
                  sourceLayer: hoverStateRef.current.sourceLayer, 
                  id: hoverStateRef.current.id 
                },
                { hover: false }
              );
            } catch (err) {
              // Ignore errors when clearing hover state
            }
            hoverStateRef.current = null;
          }
          map.getCanvas().style.cursor = '';
        };

        // Generic hover handler for any layer
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

          const source = feature.source;
          const sourceLayer = feature.sourceLayer;

          // Check if we're hovering a new feature
          if (
            !hoverStateRef.current ||
            hoverStateRef.current.id !== featureId ||
            hoverStateRef.current.source !== source ||
            hoverStateRef.current.sourceLayer !== sourceLayer
          ) {
            clearHoverState();
            try {
              map.setFeatureState(
                { source, sourceLayer, id: featureId },
                { hover: true }
              );
              hoverStateRef.current = { source, sourceLayer, id: featureId };
            } catch (err) {
              console.warn('Failed to set hover state:', err);
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

        map.on('sourcedataloading', (e: any) => {
          console.log(`Source loading: ${e.sourceId}`);
        });

        // Track zoom changes
        map.on('zoom', () => {
          const zoom = map.getZoom();
          setCurrentZoom(Math.round(zoom * 10) / 10); // Round to 1 decimal place
        });

        // Wait for map to load
        map.on('load', () => {
          console.log('Map load event fired!');
          // Set initial zoom level
          setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
          
          // Add all available datasets as sources
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
              }
            }
            
            // Add all layers with initial visibility set to none (we'll update via zoom handler)
            Object.entries(dataset.layers).forEach(([layerKey, layerConfig]) => {
              const layerId = `${dataset.id}-${layerKey}`;
              if (!map.getLayer(layerId)) {
                try {
                  const layerSpec = {
                    ...layerConfig,
                    id: layerId,
                    source: dataset.id,
                    layout: {
                      ...layerConfig.layout,
                      visibility: 'none', // Start hidden, zoom handler will show appropriate layers
                    },
                  };
                  console.log(`Adding layer ${layerId}`);
                  map.addLayer(layerSpec as any);
                  console.log(`✅ Layer added: ${layerId}`);
                  
                  // Add hover handlers for fill and outline layers
                  if (layerKey === 'fill' || layerKey === 'outline') {
                    map.on('mousemove', layerId, handleHoverMove);
                    map.on('mouseleave', layerId, handleHoverLeave);
                  }
                } catch (error) {
                  console.error(`❌ Error adding layer ${layerId}:`, error);
                }
              }
            });
          });

          // Initial layer visibility update
          updateLayerVisibility(map, map.getZoom(), dataLayers);
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
      // Don't show click info when query tools or AOI tool is active
      if (showAOITool || activeQueryTool) {
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
              
              // Check if this layer is currently visible based on zoom
              const { main, parent } = getVisibleLayers(currentZoom, dataLayers);
              if (datasetKey === main || datasetKey === parent) {
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
  }, [showClickInfo, dataLayers, showAOITool, activeQueryTool, availableLayers, currentZoom]); // Re-attach handler when these change

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

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
  };

  // Get current visible layers for display
  const { main: mainLayer, parent: parentLayer } = getVisibleLayers(currentZoom, dataLayers);

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
            backdropFilter: 'blur(8px)',
            padding: '6px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            gap: '8px',
            width: '320px',
            alignItems: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid #e4e4e7',
              borderRadius: '4px',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#18181b',
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
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '6px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Zoom indicator */}
          <div style={{
            padding: '4px 10px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#71717a',
            borderBottom: '1px solid #e4e4e7',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Zoom: {currentZoom.toFixed(1)}
            {mainLayer && (
              <span style={{ marginLeft: '8px', color: '#18181b', fontWeight: 500 }}>
                • {mainLayer}
                {parentLayer && <span style={{ color: '#a1a1aa' }}> + {parentLayer}</span>}
              </span>
            )}
          </div>
          
          {availableLayers.map(datasetKey => {
            const datasets = { ssurgo, cdl, plss, clu, states, counties, townships, sections };
            const dataset = datasets[datasetKey as keyof typeof datasets];
            
            if (!dataset) return null;
            
            const isEnabled = dataLayers.includes(datasetKey);
            const isCurrentlyVisible = datasetKey === mainLayer || datasetKey === parentLayer;
            const isParent = datasetKey === parentLayer;
            
            return (
              <div
                key={dataset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  background: isEnabled ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  opacity: isEnabled ? 1 : 0.5,
                }}
                onClick={() => toggleLayerVisibility(datasetKey)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isEnabled ? 'rgba(0, 0, 0, 0.04)' : 'transparent';
                }}
              >
                {/* Custom checkbox */}
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: isEnabled ? '1.5px solid #18181b' : '1.5px solid #a1a1aa',
                    background: isEnabled ? '#18181b' : 'white',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(datasetKey);
                  }}
                >
                  {isEnabled && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1.5 5L4 7.5L8.5 2.5" />
                    </svg>
                  )}
                </div>
                
                <span style={{ 
                  color: isEnabled ? '#18181b' : '#71717a',
                  fontSize: '13px',
                  fontWeight: isCurrentlyVisible ? 600 : 500,
                  userSelect: 'none',
                  letterSpacing: '-0.01em',
                }}>
                  {dataset.name}
                </span>
                
                {/* Visibility indicator */}
                {isEnabled && isCurrentlyVisible && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: isParent ? '#fef3c7' : '#dcfce7',
                    color: isParent ? '#92400e' : '#166534',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}>
                    {isParent ? 'parent' : 'main'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Click Info Popup */}
      {showClickInfo && clickInfo && !activeQueryTool && (
        <ClickInfo
          x={clickInfo.x}
          y={clickInfo.y}
          properties={clickInfo.properties}
          clickInfoConfig={clickInfo.config}
          visible={true}
          onClose={() => setClickInfo(null)}
        />
      )}

      {/* Query Tools Panel */}
      {showQueryTools && (
        <QueryToolsPanel
          activeTool={activeQueryTool}
          onToolSelect={(tool) => {
            setActiveQueryTool(tool);
            // Close click info when activating a tool
            if (tool) setClickInfo(null);
          }}
          availableTools={availableQueryTools}
        />
      )}

      {/* Point Lookup Widget */}
      {showQueryTools && (
        <PointLookup
          map={mapRef.current}
          apiKey={apiKey}
          baseApiUrl={apiUrl}
          isActive={activeQueryTool === 'point'}
          onToggle={() => setActiveQueryTool(activeQueryTool === 'point' ? null : 'point')}
          availableLayers={['states', 'counties', 'townships', 'sections', 'clu', 'cdl']}
          defaultLayers={['states', 'counties', 'townships']}
        />
      )}

      {/* AOI Query Widget */}
      {showQueryTools && (
        <AOIQueryWidget
          map={mapRef.current}
          apiKey={apiKey}
          baseApiUrl={apiUrl}
          isActive={activeQueryTool === 'aoi'}
          onToggle={() => setActiveQueryTool(activeQueryTool === 'aoi' ? null : 'aoi')}
        />
      )}
    </div>
  );
}
