// Dynamic imports to avoid bundling map libraries
export const loadMapLibre = async () => {
    try {
      const maplibregl = await import('maplibre-gl');
      return maplibregl.default || maplibregl;
    } catch (error) {
      console.error('Failed to load MapLibre GL JS:', error);
      throw new Error('MapLibre GL JS is required but not installed. Please install maplibre-gl.');
    }
  };
  


// Default map style - ESRI World Imagery satellite basemap
// Users can override this via the style prop
export const getDefaultMapStyle = (): object => {
    return {
      version: 8,
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
  };