import { Map } from 'react-map-gl/maplibre';
import { useRef } from 'react';
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

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAP_STYLE}
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
                  if (e.tile) {
                    console.log('📦 Tile loaded:', e.tile.tileID, {
                      state: e.tile.state,
                      aborted: e.tile.aborted,
                      expires: e.tile.expires
                    });
                    
                    // Try to inspect tile contents
                    if (e.tile.state === 'loaded') {
                      try {
                        const source = map.getSource('states') as any;
                        if (source) {
                          // Try multiple ways to access tile data
                          const tileKey = e.tile.tileID.canonical.key;
                          console.log('🔑 Tile key:', tileKey);
                          
                          if (source._tiles) {
                            const tile = source._tiles[tileKey];
                            if (tile) {
                              console.log('📦 Tile object keys:', Object.keys(tile));
                              if (tile.vectorTile) {
                                const layers = Object.keys(tile.vectorTile.layers || {});
                                console.log('🔍 Available layers in tile:', layers);
                                // Log feature count for each layer
                                layers.forEach(layerName => {
                                  const layer = tile.vectorTile.layers[layerName];
                                  console.log(`   - ${layerName}: ${layer.length} features`);
                                });
                              }
                            } else {
                              console.log('⚠️ Tile not found in source._tiles');
                            }
                          } else {
                            console.log('⚠️ source._tiles not available');
                          }
                        }
                      } catch (inspectError) {
                        console.warn('⚠️ Could not inspect tile:', inspectError);
                      }
                    }
                  }
                  
                  if (e.isSourceLoaded) {
                    console.log('✅ States source fully loaded');
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

  // Skip labels layer for now - font issues and focus on getting polygons visible first
  // try {
  //   // Add states labels layer
  //   if (!map.getLayer('states-labels')) {
  //     map.addLayer({
  //       id: 'states-labels',
  //       type: 'symbol',
  //       source: 'states',
  //       'source-layer': 'states_labels',
  //       layout: {
  //         'text-field': ['get', 'NAME'],
  //         'text-size': [
  //           'interpolate',
  //           ['linear'],
  //           ['zoom'],
  //           0, 8,
  //           3, 12,
  //           5, 16,
  //           6, 18,
  //           8, 24,
  //           12, 30
  //         ],
  //         'text-font': ['Noto Sans Regular'],
  //         'text-anchor': 'center',
  //         'text-allow-overlap': true,
  //         'text-ignore-placement': true,
  //         'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
  //         'symbol-placement': 'point',
  //         'text-padding': 2,
  //         'text-optional': false
  //       },
  //       paint: {
  //         'text-color': '#1e40af',
  //         'text-halo-color': '#ffffff',
  //         'text-halo-width': 3,
  //         'text-halo-blur': 1,
  //         'text-opacity': [
  //           'interpolate',
  //           ['linear'],
  //           ['zoom'],
  //           0, 0.7,
  //           4, 0.9,
  //           6, 1.0
  //         ]
  //       },
  //       minzoom: 0
  //     });
  //     console.log('✅ States labels layer added (source-layer: states_labels)');
  //   }
  // } catch (error) {
  //   console.error('❌ Error adding states labels layer:', error);
  // }

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

