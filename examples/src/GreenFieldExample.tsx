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
        initialVisibleLayers={['states', 'counties', 'townships', 'sections', 'clu', 'cdl', 'parcels']}
        availableLayers={['states', 'counties', 'townships', 'sections', 'clu', 'cdl', 'parcels']}
        initialCenter={[-93.6250, 41.5868]} // Des Moines, Iowa
        initialZoom={6}
        height="100%"
        width="100%"
        cdlYears={['2024', '2023', '2022', '2021', '2020']}
        initialCdlYear="2024"
        persistSettings={true}
        persistenceKey="greenfield-example"
      />
    </div>
  );
}
