import { Map } from 'react-map-gl/maplibre';
import { useEffect } from 'react';

/**
 * Simple MapLibre States Example
 * 
 * Uses our /states/style.json endpoint (similar to protomaps style URL)
 */

const LANDMAP_KEY = import.meta.env.VITE_LAND_MAP_MAGIC_API_KEY || 'dev';
const BASE_URL = import.meta.env.VITE_LAND_MAP_MAGIC_API_URL || 'https://api.landmapmagic.com';

// Our style.json endpoint (similar to protomaps style URL)
const STYLE_URL = `${BASE_URL}/states/style.json?key=${LANDMAP_KEY}`;

export default function MapLibreStatesExample() {
  useEffect(() => {
    // Manually fetch and log the style URL
    console.log('🔍 Testing style URL:', STYLE_URL);
    console.log('🔑 API Key:', LANDMAP_KEY);
    console.log('🌐 Base URL:', BASE_URL);
    
    // Verify the URL includes the key parameter
    const urlWithKey = `${BASE_URL}/states/style.json?key=${LANDMAP_KEY}`;
    console.log('📋 Full style URL:', urlWithKey);
    
    fetch(urlWithKey)
      .then(response => {
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          return response.text().then(text => {
            console.error('❌ Error response:', text);
            throw new Error(`HTTP ${response.status}: ${text}`);
          });
        }
        
        return response.json();
      })
      .then(data => {
        console.log('✅ Style JSON received:', data);
        console.log('📊 Style sources:', Object.keys(data.sources || {}));
        console.log('📊 Style layers count:', data.layers?.length || 0);
        
        // Verify the PMTiles URL includes the key
        const pmtilesUrl = data.sources?.states?.url;
        if (pmtilesUrl) {
          console.log('🗺️ PMTiles URL in style:', pmtilesUrl);
          const hasKey = pmtilesUrl.includes('key=');
          console.log('🔑 PMTiles URL has key param:', hasKey);
        }
      })
      .catch(error => {
        console.error('❌ Fetch error:', error);
      });
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Map
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={STYLE_URL}
      />
    </div>
  );
}

