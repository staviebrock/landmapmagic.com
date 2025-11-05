import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * MapBox Selectable CLU Example
 * 
 * Allows users to click to select/deselect CLU polygons
 * Displays statistics and list of selected polygons
 */

interface SelectedFeature {
  id: string;   
  properties: Record<string, any>;
}

export default function MapboxSelectableExample() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Selection state
  const [selectedPolygons, setSelectedPolygons] = useState<Map<string, SelectedFeature>>(new Map());
  const [stateVersion, setStateVersion] = useState(0);

  // Get API keys from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const landmapApiKey = import.meta.env.VITE_LANDMAP_API_KEY || 'dev';

  // Validate that tokens are not mixed up
  // Mapbox tokens start with pk.eyJ...
  // LandMap API keys start with pk_live_ or pk_test_ or 'dev'
  if (mapboxToken && !mapboxToken.startsWith('pk.eyJ')) {
    console.error('❌ ERROR: VITE_MAPBOX_TOKEN should start with pk.eyJ (Mapbox access token)');
  }
  if (landmapApiKey && landmapApiKey.startsWith('pk.eyJ')) {
    console.error('❌ ERROR: You have a Mapbox token in VITE_LANDMAP_API_KEY!');
    console.error('   LandMap API keys start with pk_live_, pk_test_, or use "dev" for development');
  }

  // LandMapMagic API endpoint
  const BASE_URL = 'https://staging-api.landmapmagic.com';
  const TILE_URL = `${BASE_URL}/clu/{z}/{x}/{y}?key=${landmapApiKey}`;

  // Debug logging
  console.log('🔑 Mapbox Token (should start with pk.eyJ):', mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'NOT SET');
  console.log('🔑 LandMap API Key (should be dev or pk_live_...):', landmapApiKey ? `${landmapApiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('🌐 CLU Tile URL:', TILE_URL);

  // Check if Mapbox token is set
  if (!mapboxToken) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        padding: '40px',
        background: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{ margin: 0, color: '#d32f2f' }}>Missing Mapbox Token</h2>
        <p style={{ margin: 0, color: '#666', textAlign: 'center', maxWidth: '600px' }}>
          Please create a <code style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '3px' }}>.env.local</code> file 
          in the <code style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '3px' }}>examples</code> directory 
          and add your <strong>VITE_MAPBOX_TOKEN</strong>.
        </p>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Copy <code style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '3px' }}>env.example</code> to 
          <code style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '3px' }}>.env.local</code> and fill in your keys.
        </p>
      </div>
    );
  }

  /**
   * Toggle polygon selection
   */
  const togglePolygonSelection = (feature: any) => {
    const map = mapRef.current;
    const primaryId = String(feature.id); // Use feature.id from Mapbox
    
    console.log('🔍 Feature ID:', primaryId);
    console.log('🔍 Acres:', feature.properties?.calcacres);
    
    setSelectedPolygons(prev => {
      const newMap = new Map(prev);
      const wasSelected = newMap.has(primaryId); // Check inside state setter to avoid stale closure
      
      if (wasSelected) {
        // Deselect - remove from map
        newMap.delete(primaryId);
        console.log('❌ Deselected:', primaryId, '| Total selected:', newMap.size);
        
        // Clear feature state immediately
        if (map && map.getLayer('clu-fill')) {
          try {
            map.setFeatureState(
              { source: 'clu', sourceLayer: 'clu', id: primaryId },
              { selected: false }
            );
          } catch (error) {
            console.warn('Failed to clear feature state:', error);
          }
        }
      } else {
        // Select - add to map
        newMap.set(primaryId, {
          id: primaryId,
          properties: feature.properties || {}
        });
        console.log('✅ Selected:', primaryId, '| Total selected:', newMap.size);
        
        // Set feature state immediately
        if (map && map.getLayer('clu-fill')) {
          try {
            map.setFeatureState(
              { source: 'clu', sourceLayer: 'clu', id: primaryId },
              { selected: true }
            );
          } catch (error) {
            console.warn('Failed to set feature state:', error);
          }
        }
      }
      return newMap;
    });

    // Increment state version
    setStateVersion(v => v + 1);
  };

  /**
   * Remove a single selection
   */
  const removeSelection = (fieldId: string) => {
    const map = mapRef.current;
    
    // Clear feature state
    if (map && map.getLayer('clu-fill')) {
      try {
        map.setFeatureState(
          { source: 'clu', sourceLayer: 'clu', id: fieldId },
          { selected: false }
        );
      } catch (error) {
        console.warn('Failed to clear feature state:', error);
      }
    }
    
    setSelectedPolygons(prev => {
      const newMap = new Map(prev);
      newMap.delete(fieldId);
      return newMap;
    });
    setStateVersion(v => v + 1);
  };

  /**
   * Clear all selections
   */
  const clearAllSelections = () => {
    const map = mapRef.current;
    
    // Clear feature states for all selected polygons
    if (map && map.getLayer('clu-fill')) {
      selectedPolygons.forEach((_feature, fieldId) => {
        try {
          map.setFeatureState(
            { source: 'clu', sourceLayer: 'clu', id: fieldId },
            { selected: false }
          );
        } catch (error) {
          console.warn('Failed to clear feature state:', error);
        }
      });
    }
    
    setSelectedPolygons(new Map());
    setStateVersion(v => v + 1);
  };

  /**
   * Calculate statistics
   */
  const calculateStats = () => {
    const count = selectedPolygons.size;
    let totalAcres = 0;
    
    selectedPolygons.forEach((feature) => {
      const props = feature.properties || {};
      const acres = parseFloat(props.calcacres || props.CALCACRES || 0);
      totalAcres += acres;
    });
    
    const avgAcres = count > 0 ? totalAcres / count : 0;
    
    return {
      count,
      totalAcres: totalAcres.toFixed(2),
      avgAcres: avgAcres.toFixed(2)
    };
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Set Mapbox token
    mapboxgl.accessToken = mapboxToken;

    // Create Mapbox map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-93.097, 41.878], // Iowa
      zoom: 13,
      pitch: 0
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('✅ Mapbox map loaded');
      console.log('📍 Map center:', map.getCenter());
      console.log('🔍 Map zoom:', map.getZoom());
      console.log('🎨 Loading CLU tiles from:', TILE_URL);

      // Add CLU vector tile source
      map.addSource('clu', {
        type: 'vector',
        tiles: [TILE_URL],
        minzoom: 11,
        maxzoom: 15
      });

      // Add fill layer (for click detection and selection highlighting)
      map.addLayer({
        id: 'clu-fill',
        type: 'fill',
        source: 'clu',
        'source-layer': 'clu',
        minzoom: 11,
        // No maxzoom - keep displaying zoom 15 tiles even when zoomed in closer
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#00ff00', // Bright green for selected
            'rgba(0, 0, 0, 0.01)' // Nearly invisible for unselected (but still clickable!)
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.3, // 30% opacity for selected
            0.01 // 1% opacity for unselected (makes entire polygon clickable)
          ]
        }
      });

      // Add line layer (yellow borders)
      map.addLayer({
        id: 'clu-outline',
        type: 'line',
        source: 'clu',
        'source-layer': 'clu',
        minzoom: 11,
        // No maxzoom - keep displaying zoom 15 tiles even when zoomed in closer
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#00ff00', // Bright green border for selected
            '#fde047' // Yellow border for unselected
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3, // Thicker border for selected
            1.5 // Regular border for unselected
          ]
        }
      });

      // Add labels layer (using symbol layer for text)
      map.addLayer({
        id: 'clu-labels',
        type: 'symbol',
        source: 'clu',
        'source-layer': 'clu_labels',
        minzoom: 13,
        // No maxzoom - keep displaying zoom 15 tiles even when zoomed in closer
        layout: {
          'text-field': ['get', 'calcacres'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      console.log('✅ Native Mapbox MVT layers added');

      // Handle click events on the fill layer
      map.on('click', 'clu-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        console.log('🖱️ Clicked feature:', feature);
        
        togglePolygonSelection({
          id: feature.id,
          properties: feature.properties
        });
      });

      // Change cursor on hover
      map.on('mouseenter', 'clu-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'clu-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Add hover effect
      let hoveredFeatureId: string | number | null = null;

      map.on('mousemove', 'clu-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
              { hover: false }
            );
          }
          hoveredFeatureId = e.features[0].id as string | number;
          map.setFeatureState(
            { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'clu-fill', () => {
        if (hoveredFeatureId !== null) {
          map.setFeatureState(
            { source: 'clu', sourceLayer: 'clu', id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = null;
      });
    });

    // Add error handling for tile loading
    map.on('error', (e) => {
      console.error('❌ Mapbox error:', e);
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync feature states when component remounts or map reloads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer('clu-fill')) return;

    console.log('🔄 Syncing selection styling, selected:', selectedPolygons.size);

    // Reapply all feature states (useful if map style reloaded)
    selectedPolygons.forEach((_feature, fieldId) => {
      try {
        map.setFeatureState(
          { source: 'clu', sourceLayer: 'clu', id: fieldId },
          { selected: true }
        );
      } catch (error) {
        console.warn('Failed to set feature state for:', fieldId, error);
      }
    });
  }, [stateVersion, selectedPolygons]);

  const stats = calculateStats();

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ flex: 1 }} />

      {/* Stats Panel */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          minWidth: '250px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1000
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
          📊 Selected Fields
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Count:</span>
          <span style={{ color: '#000' }}>{stats.count}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Total Acres:</span>
          <span style={{ color: '#000' }}>{stats.totalAcres}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Average Acres:</span>
          <span style={{ color: '#000' }}>{stats.avgAcres}</span>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>
            Selected Polygons:
          </h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {selectedPolygons.size === 0 ? (
              <div style={{ color: '#999', fontStyle: 'italic', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                Click polygons to select
              </div>
            ) : (
              Array.from(selectedPolygons.entries()).map(([fieldId, feature]) => {
                const props = feature.properties || {};
                const acres = props.calcacres || props.CALCACRES || 'N/A';
                const displayAcres = typeof acres === 'number' ? acres.toFixed(2) : acres;
                
                return (
                  <div
                    key={fieldId}
                    style={{
                      padding: '8px',
                      margin: '5px 0',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>ID:</strong> {fieldId}<br />
                      <strong>Acres:</strong> {displayAcres}
                    </div>
                    <button
                      onClick={() => removeSelection(fieldId)}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#cc0000'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ff4444'}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {selectedPolygons.size > 0 && (
          <button
            onClick={clearAllSelections}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '10px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0052a3'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#0066cc'}
          >
            Clear All
          </button>
        )}
      </div>

    </div>
  );
}

