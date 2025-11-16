import { Map } from 'react-map-gl/maplibre';
import { useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Simple MapLibre States Example
 * 
 * Uses MVT tiles endpoint directly (standard vector tiles, no PMTiles protocol needed)
 */

const LANDMAP_KEY = import.meta.env.VITE_LAND_MAP_MAGIC_API_KEY || 'dev';
const BASE_URL = import.meta.env.VITE_LAND_MAP_MAGIC_API_URL || 'https://api.landmapmagic.com';

// States MVT tiles URL - standard vector tile endpoint
const normalizedBaseUrl = BASE_URL.replace(/\/$/, '');
const STATES_TILES_URL = `${normalizedBaseUrl}/states/{z}/{x}/{y}?key=${LANDMAP_KEY}`;

// Basemap style - ESRI World Imagery satellite (same as used in other examples)
  const BASEMAP_STYLE = {
    version: 8 as const,
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
    'esri-satellite': {
      type: 'raster' as const,
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
      type: 'raster' as const,
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function MapLibreStatesExample() {
  const mapRef = useRef<any>(null);
  const [zoom, setZoom] = useState(4);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAP_STYLE}
        onMove={(evt) => {
          setZoom(Math.round(evt.viewState.zoom * 10) / 10);
        }}
        onLoad={(e) => {
          const map = e.target;
          console.log('✅ Map loaded');
          console.log('🔍 States tiles URL:', STATES_TILES_URL);
          
          // Add states MVT tiles source (standard vector tiles, no PMTiles protocol needed)
          if (!map.getSource('states')) {
            try {
              map.addSource('states', {
                type: 'vector',
                tiles: [STATES_TILES_URL],
                minzoom: 0,
                maxzoom: 12,
                attribution: 'US Census Bureau TIGER/Line / LandMapMagic'
              });
             
              console.log('✅ States MVT tiles source added:', STATES_TILES_URL);
              
              // Add layers immediately (vector tiles don't need to wait for TileJSON)
              addStatesLayers(map);
              
              // Listen for tile loading events to debug
              map.on('sourcedata', (e) => {
                if (e.sourceId === 'states') {
                  console.log('🔍 Source data event:', e);
                  if (e.tile) {
                    console.log('📦 Tile loaded:', e.tile.tileID, {
                      state: e.tile.state,
                      aborted: e.tile.aborted,
                      expires: e.tile.expires
                    });
                    
                    // Try to inspect tile contents when loaded
                    if (e.tile.state === 'loaded' && e.tile.buckets) {
                      try {
                        // Check what buckets/layers are in the tile (these are the rendered layers)
                        const bucketKeys = Object.keys(e.tile.buckets);
                        console.log('🔍 Available buckets (rendered layers) in tile:', bucketKeys);
                        
                        // Also check the source for vectorTile data (these are the source-layers)
                        const source = map.getSource('states') as any;
                        const tileKey = e.tile.tileID.canonical.key;
                        
                        if (source?._tiles?.[tileKey]) {
                          const tile = source._tiles[tileKey];
                          if (tile.vectorTile) {
                            const layers = Object.keys(tile.vectorTile.layers || {});
                            console.log('🔍 Available source-layers in vectorTile:', layers);
                            layers.forEach(layerName => {
                              const layer = tile.vectorTile.layers[layerName];
                              console.log(`   - ${layerName}: ${layer.length} features`);
                              
                              // Check if this is the states_labels layer
                              if (layerName === 'states_labels' && layer.length > 0) {
                                console.log(`   ✅ Found states_labels with ${layer.length} point features!`);
                                // Log first feature to see properties
                                if (layer.feature) {
                                  const firstFeature = layer.feature(0);
                                  console.log('   First feature properties:', firstFeature.properties);
                                }
                              }
                            });
                          }
                        }
                      } catch (inspectError) {
                        console.warn('⚠️ Could not inspect tile:', inspectError);
                      }
                    }
                  }
                  
                  if (e.isSourceLoaded) {
                    console.log('✅ States source fully loaded');
                    
                    // Inspect all loaded tiles to see what layers are available
                    try {
                      const source = map.getSource('states') as any;
                      if (source?._tiles) {
                        const tileKeys = Object.keys(source._tiles);
                        console.log(`📊 Total tiles loaded: ${tileKeys.length}`);
                        
                        // Check first few tiles for layers
                        tileKeys.slice(0, 3).forEach(key => {
                          const tile = source._tiles[key];
                          if (tile?.vectorTile?.layers) {
                            const layers = Object.keys(tile.vectorTile.layers);
                            console.log(`🔍 Tile ${key} has layers:`, layers);
                            layers.forEach(layerName => {
                              const layer = tile.vectorTile.layers[layerName];
                              console.log(`   - ${layerName}: ${layer.length} features`);
                            });
                          }
                        });
                      }
                    } catch (err) {
                      console.warn('⚠️ Could not inspect source after load:', err);
                    }
                  }
                }
              });
              
              // Listen for data loading events
              map.on('data', (e: any) => {
                if (e.dataType === 'source' && e.sourceId === 'states') {
                  console.log('📊 Source data event:', e.dataType, e.isSourceLoaded ? '(loaded)' : '(loading)');
                }
              });
              
              map.on('error', (e) => {
                if (e.error) {
                  console.error('❌ Map error:', e.error);
                  if (e.error.message) {
                    console.error('   Error message:', e.error.message);
                  }
                }
              });
              
              // Also listen for layer errors
              map.on('styleimagemissing', (e) => {
                console.warn('⚠️ Missing image:', e.id);
              });
              
            } catch (error) {
              console.error('❌ Error adding states source:', error);
              console.error('   Error details:', error);
            }
          } else {
            // Source already exists, add layers
            addStatesLayers(map);
          }
        }}
      />
      
      {/* Zoom level indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        Zoom: {zoom.toFixed(1)}
      </div>
    </div>
  );
}

// Helper function to add states layers
function addStatesLayers(map: any) {
  try {
    // Add states fill layer
    if (!map.getLayer('states-fill')) {
      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states',
        'source-layer': 'states', // From process_states_simple.py: layer name is 'states'
        paint: {
          'fill-color': '#fde047', // Yellow fill
          'fill-opacity': 0.3 // Subtle opacity
        },
        minzoom: 0
      });
      console.log('✅ States fill layer added (source-layer: states)');
      
      // Verify layer was added
      const addedLayer = map.getLayer('states-fill');
      if (addedLayer) {
        console.log('✅ Verified: states-fill layer exists in map');
        console.log('   Layer visibility:', map.getLayoutProperty('states-fill', 'visibility') || 'default');
      } else {
        console.error('❌ Layer was not added successfully!');
      }
    } else {
      console.log('⚠️ States fill layer already exists');
    }
  } catch (error) {
    console.error('❌ Error adding states fill layer:', error);
    console.error('   Full error:', error);
  }

  try {
    // Add states outline layer
    if (!map.getLayer('states-outline')) {
      map.addLayer({
        id: 'states-outline',
        type: 'line',
        source: 'states',
        'source-layer': 'states', // From process_states_simple.py: layer name is 'states'
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#fde047', // Yellow outline
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ],
          'line-opacity': 0.9
        },
        minzoom: 0
      });
      console.log('✅ States outline layer added (source-layer: states)');
      
      // Verify layer was added
      const addedLayer = map.getLayer('states-outline');
      if (addedLayer) {
        console.log('✅ Verified: states-outline layer exists in map');
      } else {
        console.error('❌ Outline layer was not added successfully!');
      }
    } else {
      console.log('⚠️ States outline layer already exists');
    }
  } catch (error) {
    console.error('❌ Error adding states outline layer:', error);
    console.error('   Full error:', error);
  }

  // Add labels layer with absolute minimal configuration
  try {
    if (!map.getLayer('states-labels')) {
      map.addLayer({
        id: 'states-labels',
        type: 'symbol',
        source: 'states',
        'source-layer': 'states_labels',
        layout: {
          'text-field': ['get', 'NAME'], // Just try uppercase NAME property
          'text-size': 16
          // NO text-font specified - let MapLibre use its default
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        },
        minzoom: 3
      });
      console.log('✅ States labels layer added (source-layer: states_labels) - using default font');
      
      const addedLayer = map.getLayer('states-labels');
      if (addedLayer) {
        console.log('✅ Verified: states-labels layer exists in map');
      } else {
        console.error('❌ Labels layer was not added successfully!');
      }
    } else {
      console.log('⚠️ States labels layer already exists');
    }
  } catch (error) {
    console.error('❌ Error adding states labels layer:', error);
    console.error('   Full error:', error);
  }

  // Add hover effect
  let hoveredStateId: string | null = null;

  const handleMouseMove = (e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const stateId = feature.id;

      if (hoveredStateId !== stateId) {
        // Clear previous hover
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'states', sourceLayer: 'states', id: hoveredStateId },
            { hover: false }
          );
        }

        // Set new hover
        hoveredStateId = stateId as string;
        map.setFeatureState(
          { source: 'states', sourceLayer: 'states', id: hoveredStateId },
          { hover: true }
        );

        map.getCanvas().style.cursor = 'pointer';
      }
    }
  };

  const handleMouseLeave = () => {
    if (hoveredStateId !== null) {
      map.setFeatureState(
        { source: 'states', sourceLayer: 'states', id: hoveredStateId },
        { hover: false }
      );
      hoveredStateId = null;
    }
    map.getCanvas().style.cursor = '';
  };

  map.on('mousemove', 'states-fill', handleMouseMove);
  map.on('mouseleave', 'states-fill', handleMouseLeave);
}

