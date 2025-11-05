import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { TextLayer } from '@deck.gl/layers';
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
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  // Selection state
  const [selectedPolygons, setSelectedPolygons] = useState<Map<string, SelectedFeature>>(new Map());
  const [selectedIdLookup, setSelectedIdLookup] = useState<Map<string, string>>(new Map());
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

  // Check if keys are mixed up (Mapbox tokens start with pk.eyJ)
  if (landmapApiKey && landmapApiKey.startsWith('pk.eyJ')) {
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
        background: '#fff3cd',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '48px' }}>🔀</div>
        <h2 style={{ margin: 0, color: '#856404' }}>API Keys Mixed Up!</h2>
        <p style={{ margin: 0, color: '#856404', textAlign: 'center', maxWidth: '600px' }}>
          You have a <strong>Mapbox token</strong> (pk.eyJ...) in <code style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '3px' }}>VITE_LANDMAP_API_KEY</code>
        </p>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          maxWidth: '600px',
          textAlign: 'left',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Your .env.local should look like:</p>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px', 
            margin: 0,
            fontSize: '13px',
            overflow: 'auto'
          }}>{`# Mapbox token (for the satellite basemap - starts with pk.eyJ)
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ...

# LandMap API key (for CLU data - starts with pk_live_ or pk_test_)
VITE_LANDMAP_API_KEY=pk_live_your_key_here
# Or use 'dev' for development:
# VITE_LANDMAP_API_KEY=dev`}</pre>
        </div>
      </div>
    );
  }

  // Helper to format acres
  const formatAcres = (value: number | null | undefined): string => {
    if (value == null) return '';
    return value.toFixed(2);
  };

  /**
   * Get consistent field ID from feature
   */
  const getFieldId = (feature: any): string => {
    // Check feature.id first (this is where MVT features store their ID)
    if (feature.id !== undefined && feature.id !== null && feature.id !== '') {
      return String(feature.id);
    }
    
    // Fallback: check properties
    const props = feature.properties || {};
    const id = props.id || props.ID || props.objectid || props.OBJECTID || 
               props.fid || props.FID || props.gid || props.GID;
    
    if (id !== undefined && id !== null && id !== '') {
      return String(id);
    }
    
    // Last resort: generate ID from properties
    return `field_${JSON.stringify(props)}`;
  };

  /**
   * Generate all possible ID formats for a feature
   */
  const getAllPossibleIds = (feature: any): string[] => {
    const ids: string[] = [];
    
    // 1. Root level ID (from click event)
    if (feature.id !== undefined && feature.id !== null && feature.id !== '') {
      ids.push(String(feature.id));
    }
    
    // 2. Properties-based IDs
    const props = feature.properties || {};
    if (props.id !== undefined && props.id !== null && props.id !== '') {
      ids.push(String(props.id));
    }
    
    // 3. Fallback ID from properties (what rendering uses)
    const propsId = `field_${JSON.stringify(props)}`;
    ids.push(propsId);
    
    return ids;
  };

  /**
   * Toggle polygon selection
   */
  const togglePolygonSelection = (feature: any) => {
    const allIds = getAllPossibleIds(feature);
    const primaryId = allIds[0]; // Use first ID as primary
    
    console.log('🔍 All IDs for feature:', allIds);
    console.log('🔍 Acres:', feature.properties?.calcacres);
    
    setSelectedPolygons(prev => {
      const newMap = new Map(prev);
      if (newMap.has(primaryId)) {
        // Deselect
        newMap.delete(primaryId);
        console.log('❌ Deselected:', primaryId);
      } else {
        // Select
        newMap.set(primaryId, {
          id: primaryId,
          properties: feature.properties || {}
        });
        console.log('✅ Selected:', primaryId, '| Total selected:', newMap.size);
      }
      return newMap;
    });

    // Update ID lookup
    setSelectedIdLookup(prev => {
      const newLookup = new Map(prev);
      if (prev.has(primaryId)) {
        // Remove all ID mappings
        allIds.forEach(id => newLookup.delete(id));
      } else {
        // Create mappings for all ID formats
        allIds.forEach(id => newLookup.set(id, primaryId));
        console.log('✅ ID mappings created:', allIds);
      }
      return newLookup;
    });
    
    // Increment state version to trigger deck.gl update
    setStateVersion(v => v + 1);
  };

  /**
   * Remove a single selection
   */
  const removeSelection = (fieldId: string) => {
    setSelectedPolygons(prev => {
      const newMap = new Map(prev);
      const feature = newMap.get(fieldId);
      
      if (feature) {
        const allIds = getAllPossibleIds({ id: fieldId, properties: feature.properties });
        setSelectedIdLookup(lookup => {
          const newLookup = new Map(lookup);
          allIds.forEach(id => newLookup.delete(id));
          return newLookup;
        });
      }
      
      newMap.delete(fieldId);
      return newMap;
    });
    setStateVersion(v => v + 1);
  };

  /**
   * Clear all selections
   */
  const clearAllSelections = () => {
    setSelectedPolygons(new Map());
    setSelectedIdLookup(new Map());
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

  /**
   * Create deck.gl layers with selection styling
   */
  const createLayers = () => {
    // Capture current stateVersion for updateTriggers
    const currentStateVersion = stateVersion;
    
    // Create a snapshot of the lookup map for this render
    const idLookupSnapshot = new Map(selectedIdLookup);
    
    console.log('🎨 Creating layers with lookup map size:', idLookupSnapshot.size);
    
    // Track if styling functions are called
    let fillColorCallCount = 0;
    
    // 1) CLU Polygons (source-layer "clu")
    const cluPolygons = new MVTLayer({
      id: 'clu-polygons',
      data: TILE_URL,
      loadOptions: { 
        mvt: { 
          layers: ['clu']
        } 
      },
      minZoom: 11,
      maxZoom: 15,
      filled: true,
      stroked: true,
      
      // Error handling
      onDataLoad: (data: any) => {
        console.log('✅ CLU polygons loaded:', data?.length || 0, 'features');
      },
      onError: (error: any) => {
        console.error('❌ Error loading CLU polygons:', error);
      },
      
      // Dynamic styling based on selection
      getFillColor: (feature: any) => {
        const fieldId = getFieldId(feature);
        const isSelected = idLookupSnapshot.has(fieldId);
        
        fillColorCallCount++;
        if (fillColorCallCount <= 5) {
          console.log(`🎨 getFillColor called: ID=${fieldId}, selected=${isSelected}`);
        }
        
        if (isSelected) {
          // Brighter green fill with more opacity
          return [0, 255, 0, 80];
        }
        return [0, 0, 0, 0]; // Transparent for unselected
      },
      
      getLineColor: (feature: any) => {
        const fieldId = getFieldId(feature);
        const isSelected = idLookupSnapshot.has(fieldId);
        
        if (isSelected) {
          // SUPER BRIGHT LIME GREEN outline
          return [0, 255, 0, 255];
        }
        return [253, 224, 71, 230]; // Yellow for unselected
      },
      
      getLineWidth: (feature: any) => {
        const fieldId = getFieldId(feature);
        const isSelected = idLookupSnapshot.has(fieldId);
        return isSelected ? 10 : 2;
      },
      
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 15,
      pickable: true,
      
      onClick: (info: any) => {
        if (!info.object) return;
        togglePolygonSelection(info.object);
      },
      
      // Highlight on hover
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      
      // Force deck.gl to re-evaluate styling when stateVersion changes
      updateTriggers: {
        getFillColor: currentStateVersion,
        getLineColor: currentStateVersion,
        getLineWidth: currentStateVersion
      }
    });

    // 2) CLU Labels as TEXT (source-layer "clu_labels")
    const cluLabels = new MVTLayer({
      id: 'clu-labels',
      data: TILE_URL,
      binary: false,
      loadOptions: { 
        mvt: { 
          layers: ['clu_labels']
        } 
      },
      minZoom: 13,
      maxZoom: 15,
      pickable: false,

      // Override renderSubLayers to turn point features into TextLayer
      renderSubLayers: (sublayerProps: any) => {
        const { data } = sublayerProps;

        if (!data || !data.length) {
          return null;
        }

        return new TextLayer({
          ...sublayerProps,
          id: `${sublayerProps.id}-text`,
          data,
          getPosition: (f: any) => f.geometry.coordinates,
          getText: (f: any) => {
            const props = f.properties || {};
            const acres = props.calcacres || props.CALCACRES;
            return formatAcres(acres);
          },
          getSize: 13,
          sizeUnits: 'pixels',
          getColor: [0, 0, 0, 255],
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
          
          // White outline for contrast
          fontSettings: {
            sdf: true,
            fontSize: 64,
            buffer: 4
          },
          outlineWidth: 6,
          outlineColor: [255, 255, 255, 255],
          
          fontFamily: 'Arial, sans-serif',
          pickable: false
        });
      }
    });

    return [cluPolygons, cluLabels];
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

      // Create deck.gl overlay WITHOUT interleaved mode (not compatible with mapbox-gl v2)
      const deckOverlay = new MapboxOverlay({
        layers: createLayers()
      });

      deckOverlayRef.current = deckOverlay;
      map.addControl(deckOverlay as any);

      console.log('✅ Deck.gl overlay added with CLU layers');
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

  // Update deck.gl layers when selection changes
  useEffect(() => {
    if (deckOverlayRef.current) {
      console.log('🔄 Refreshing layers, stateVersion:', stateVersion, 'Selected:', selectedPolygons.size);
      const newLayers = createLayers();
      deckOverlayRef.current.setProps({ layers: newLayers });
    }
  }, [stateVersion]);

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

