import { LandMap } from 'landmapmagic';

export default function BasicExample() {
  // Get API key and URL from environment variables
  const apiKey = import.meta.env.VITE_LAND_MAP_MAGIC_API_KEY || '';
  const apiUrl = import.meta.env.VITE_LAND_MAP_MAGIC_API_URL || 'https://api.landmapmagic.com';

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <LandMap
        baseApiUrl={apiUrl}
        apiKey={apiKey}
        showLegend={false}
        initialVisibleLayers={['clu']}
        availableLayers={['clu']}
        height="100%"
        width="100%"
      />
    </div>
  );
}

