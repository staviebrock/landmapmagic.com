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
  


// Default map style - simple fallback for demo purposes
// Users should provide their own style via the style prop
export const getDefaultMapStyle = (): string => {
    return 'https://demotiles.maplibre.org/style.json';
  };