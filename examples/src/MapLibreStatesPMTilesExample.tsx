import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { useRef, useState, useEffect } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibre States PMTiles Example
 * 
 * Directly loads states PMTiles from the tile-worker endpoint
 * using the pmtiles:// protocol handler.
 * 
 * This is a minimal example showing how to:
 * 1. Register the PMTiles protocol with MapLibre
 * 2. Load a PMTiles source using the pmtiles:// URL scheme
 * 3. Add vector layers from the PMTiles data
 */

const LANDMAP_KEY = import.meta.env.VITE_LAND_MAP_MAGIC_API_KEY || 'dev';
const BASE_URL = import.meta.env.VITE_LAND_MAP_MAGIC_API_URL || 'https://api.landmapmagic.com';

// Normalize base URL (remove trailing slash)
const normalizedBaseUrl = BASE_URL.replace(/\/$/, '');

// PMTiles URL - uses pmtiles:// protocol
const STATES_PMTILES_URL = `pmtiles://${normalizedBaseUrl}/v1/tiles/states.pmtiles?key=${LANDMAP_KEY}`;

// Basemap style - ESRI World Imagery satellite
const BASEMAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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

export default function MapLibreStatesPMTilesExample() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [zoom, setZoom] = useState(4);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Register PMTiles protocol BEFORE creating the map
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    console.log('✅ PMTiles protocol registered');

    // Create map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLE,
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4
    });

    mapRef.current = map;

    map.on('move', () => {
      setZoom(Math.round(map.getZoom() * 10) / 10);
    });

    map.on('load', () => {
      console.log('✅ Map loaded');
      console.log('🔍 States PMTiles URL:', STATES_PMTILES_URL);

      try {
        // Add PMTiles source
        map.addSource('states', {
          type: 'vector',
          url: STATES_PMTILES_URL,
          attribution: 'US Census Bureau TIGER/Line / LandMapMagic'
        });
        console.log('✅ States PMTiles source added');

        // Add fill layer
        map.addLayer({
          id: 'states-fill',
          type: 'fill',
          source: 'states',
          'source-layer': 'states',
          paint: {
            'fill-color': '#fde047',
            'fill-opacity': 0.25
          },
          minzoom: 0
        });
        console.log('✅ States fill layer added');

        // Add outline layer
        map.addLayer({
          id: 'states-outline',
          type: 'line',
          source: 'states',
          'source-layer': 'states',
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#fde047',
            'line-width': 2,
            'line-opacity': 0.9
          },
          minzoom: 0
        });
        console.log('✅ States outline layer added');

        // Add labels layer (uses states_labels source-layer with point features)
        map.addLayer({
          id: 'states-labels',
          type: 'symbol',
          source: 'states',
          'source-layer': 'states_labels',
          layout: {
            'text-field': ['get', 'NAME'],
            'text-size': 14,
            'text-anchor': 'center',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2
          },
          minzoom: 3
        });
        console.log('✅ States labels layer added');

        // Hover interaction
        let hoveredStateId: string | number | null = null;

        map.on('mousemove', 'states-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            
            if (hoveredStateId !== null && hoveredStateId !== feature.id) {
              map.setFeatureState(
                { source: 'states', sourceLayer: 'states', id: hoveredStateId },
                { hover: false }
              );
            }

            hoveredStateId = feature.id ?? null;
            if (hoveredStateId !== null) {
              map.setFeatureState(
                { source: 'states', sourceLayer: 'states', id: hoveredStateId },
                { hover: true }
              );
            }

            map.getCanvas().style.cursor = 'pointer';
          }
        });

        map.on('mouseleave', 'states-fill', () => {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'states', sourceLayer: 'states', id: hoveredStateId },
              { hover: false }
            );
            hoveredStateId = null;
          }
          map.getCanvas().style.cursor = '';
        });

        // Click to log state name
        map.on('click', 'states-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            const name = props?.NAME || props?.name || 'Unknown';
            console.log(`🗺️ Clicked: ${name}`);
          }
        });

        setStatus('ready');

      } catch (error) {
        console.error('❌ Error setting up states layer:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    });

    map.on('error', (e) => {
      console.error('❌ Map error:', e.error);
      if (e.error?.message?.includes('pmtiles')) {
        setErrorMessage(e.error.message);
        setStatus('error');
      }
    });

    // Cleanup
    return () => {
      maplibregl.removeProtocol('pmtiles');
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#0a0a0b' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Status overlay */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '8px',
          fontSize: '16px',
          fontFamily: 'system-ui, sans-serif',
          zIndex: 1000
        }}>
          Loading PMTiles...
        </div>
      )}

      {status === 'error' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '400px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading PMTiles</div>
          <div style={{ opacity: 0.9 }}>{errorMessage}</div>
        </div>
      )}

      {/* Info panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#fde047' }}>
          States PMTiles Example
        </div>
        <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
          Direct PMTiles loading via <code style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2px 4px', 
            borderRadius: '3px',
            fontSize: '12px'
          }}>pmtiles://</code> protocol.
          <br />
          Hover to highlight, click for details.
        </div>
      </div>

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        zIndex: 1000
      }}>
        Zoom: {zoom.toFixed(1)}
      </div>

      {/* URL info (debug) */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#71717a',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '400px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: 1000
      }}>
        {STATES_PMTILES_URL.replace(LANDMAP_KEY, '***')}
      </div>
    </div>
  );
}

