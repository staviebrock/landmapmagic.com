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
  


// Default map style from environment (required at build time)
export const getDefaultMapStyle = (): string => {
    const styleUrl = process.env.REACT_APP_MAP_STYLE_URL;
    console.log('Map style URL from environment:', styleUrl);
    return styleUrl || 'https://demotiles.maplibre.org/style.json'; // fallback style
  };