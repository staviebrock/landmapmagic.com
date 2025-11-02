import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { TextLayer } from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Example: Integrating LandMapMagic CLU data into an EXISTING Mapbox map
 * 
 * This demonstrates how a customer (like CommonGround) can add CLU field
 * boundaries and acreage labels to their existing Mapbox implementation.
 * 
 * Styling matches google-maps-example.html:
 * - Yellow field boundaries (#fde047)
 * - Black acreage labels with white outline
 * - Minimal performance impact using MVT tiles
 */

// Extend ImportMeta interface for Vite environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_MAPBOX_TOKEN?: string;
      VITE_LANDMAP_API_KEY?: string;
    };
  }
}

export default function ExistingMapboxExample() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const [showCLU, setShowCLU] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Get API keys from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
  const landmapApiKey = import.meta.env.VITE_LANDMAP_API_KEY || 'dev';

  // LandMapMagic API endpoint
  const BASE_URL = 'https://staging-api.landmapmagic.com';
  const TILE_URL = `${BASE_URL}/clu/{z}/{x}/{y}?key=${landmapApiKey}`;

  // Helper to format acres with 2 decimal places
  const formatAcres = (value: number | null | undefined): string => {
    if (value == null) return '';
    return value.toFixed(2);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Set Mapbox token
    mapboxgl.accessToken = mapboxToken;

    // 1) Create your existing Mapbox map (this is what the customer already has)
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-93.097, 41.878], // Iowa
      zoom: 13,
      pitch: 0
    });

    mapRef.current = map;

    map.on('load', () => {
      // 2) Create deck.gl overlay for CLU data
      const deckOverlay = new MapboxOverlay({
        interleaved: true,
        layers: []
      });

      deckOverlayRef.current = deckOverlay;
      map.addControl(deckOverlay as any);

      // 3) Update layers
      updateDeckLayers();

      console.log('✅ Mapbox map initialized with CLU overlay');
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update deck.gl layers when toggles change
  useEffect(() => {
    updateDeckLayers();
  }, [showCLU, showLabels]);

  const updateDeckLayers = () => {
    if (!deckOverlayRef.current) return;

    const layers = [];

    // CLU Polygons (field boundaries)
    if (showCLU) {
      layers.push(
        new MVTLayer({
          id: 'clu-polygons',
          data: TILE_URL,
          loadOptions: {
            mvt: {
              layers: ['clu'] // Only load 'clu' source-layer for polygons
            }
          },
          minZoom: 11,
          maxZoom: 15,
          filled: false,
          stroked: true,
          getLineColor: [253, 224, 71, 230], // #fde047 yellow (matches Google Maps example)
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          lineWidthMaxPixels: 4,
          pickable: true,
          onClick: (info: any) => {
            if (!info.object) return;
            const props = info.object.properties || {};
            const acres = props.calcacres || props.CALCACRES || 'Unknown';
            const fieldId = props.id || props.ID || 'N/A';
            
            // Show popup with field info
            new mapboxgl.Popup()
              .setLngLat(info.coordinate)
              .setHTML(`
                <div style="padding: 10px;">
                  <strong>🌾 CLU Field</strong><br/>
                  <strong>Acres:</strong> ${acres}<br/>
                  <strong>Field ID:</strong> ${fieldId}
                </div>
              `)
              .addTo(mapRef.current!);
            
            console.log('CLU polygon:', props);
          }
        })
      );
    }

    // CLU Labels (acreage text)
    if (showLabels) {
      layers.push(
        new MVTLayer({
          id: 'clu-labels',
          data: TILE_URL,
          binary: false, // Required to use TextLayer in renderSubLayers
          loadOptions: {
            mvt: {
              layers: ['clu_labels'] // Only load 'clu_labels' source-layer for points
            }
          },
          minZoom: 13, // Labels start at zoom 13 (matches Google Maps example)
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
              // MVT points come through as GeoJSON features
              getPosition: (f: any) => f.geometry.coordinates,
              getText: (f: any) => {
                const props = f.properties || {};
                const acres = props.calcacres || props.CALCACRES;
                return formatAcres(acres);
              },
              getSize: 13,
              sizeUnits: 'pixels',
              getColor: [0, 0, 0, 255], // Black text
              getTextAnchor: 'middle',
              getAlignmentBaseline: 'center',

              // White outline for contrast (matches Google Maps example)
              fontSettings: {
                sdf: true,
                fontSize: 64,
                buffer: 4
              },
              outlineWidth: 6,
              outlineColor: [255, 255, 255, 255],

              // Font styling
              fontFamily: 'Arial, sans-serif',

              pickable: false
            });
          }
        })
      );
    }

    deckOverlayRef.current.setProps({ layers });
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div
        style={{
          padding: '15px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
            🗺️ Existing Mapbox + LandMapMagic CLU Integration
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Example for integrating CLU data into your existing Mapbox map
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCLU}
              onChange={(e) => setShowCLU(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Field Boundaries</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Acreage Labels</span>
          </label>

          <div
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            API: staging-api.landmapmagic.com
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ flex: 1 }} />

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          maxWidth: '400px',
          fontSize: '13px',
          lineHeight: '1.5'
        }}
      >
        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          💡 Integration Guide
        </strong>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Yellow field boundaries show CLU parcels</li>
          <li>Black labels show calculated acreage</li>
          <li>Click any field for details</li>
          <li>Toggle layers on/off with checkboxes</li>
          <li>Zoom in to see labels (zoom 13+)</li>
        </ul>
      </div>
    </div>
  );
}

