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
        showLegend={true}
        showSearch={true}
        showClickInfo={true}
        showQueryTools={true}
        availableQueryTools={['point', 'aoi']}
        initialVisibleLayers={['states', 'counties', 'townships', 'sections', 'clu', 'cdl']}
        availableLayers={['states', 'counties', 'townships', 'sections', 'clu', 'cdl', 'ssurgo']}
        initialCenter={[-93.6250, 41.5868]} // Des Moines, Iowa
        initialZoom={6}
        height="100%"
        width="100%"
      />
    </div>
  );
}
