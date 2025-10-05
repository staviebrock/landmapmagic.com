import { useState } from 'react';
import { AOIQuery, AOIQueryResult } from './AOIQuery';
import type { Feature, Polygon } from 'geojson';

interface AOIQueryExampleProps {
  map: any;
  datasets: any;
}

export function AOIQueryExample({ map, datasets }: AOIQueryExampleProps) {
  const [queryEnabled, setQueryEnabled] = useState(false);
  const [aoi, setAoi] = useState<Feature<Polygon> | null>(null);
  const [results, setResults] = useState<AOIQueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Toggle query tool
  const toggleQueryTool = () => {
    const newEnabled = !queryEnabled;
    setQueryEnabled(newEnabled);
    
    if (newEnabled) {
      enableDrawing();
    } else {
      disableDrawing();
      setAoi(null);
      setResults([]);
      setError(null);
    }
  };

  // Enable drawing mode
  const enableDrawing = () => {
    if (!map) return;
    
    setIsDrawing(true);
    map.getCanvas().style.cursor = 'crosshair';
    
    // Simple click-to-create-circle AOI (for demo)
    map.on('click', handleMapClick);
  };

  // Disable drawing mode
  const disableDrawing = () => {
    if (!map) return;
    
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
    map.off('click', handleMapClick);
  };

  // Handle map click to create AOI
  const handleMapClick = (e: any) => {
    const center = [e.lngLat.lng, e.lngLat.lat];
    
    // Create a small circular AOI (100 meter radius)
    const circle = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createCircleCoordinates(center, 100)] // 100 meters
      },
      properties: {}
    };
    
    setAoi(circle);
    setError(null);
  };

  // Create circle coordinates (simple approximation)
  const createCircleCoordinates = (center: number[], radiusMeters: number) => {
    const points = 16;
    const coords = [];
    const earthRadius = 6371000; // meters
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360 / points) * Math.PI / 180;
      const lat = center[1] + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(angle);
      const lng = center[0] + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(center[1] * Math.PI / 180);
      coords.push([lng, lat]);
    }
    
    return coords;
  };

  // Handle query results
  const handleResults = (queryResults: AOIQueryResult[]) => {
    setResults(queryResults);
    setError(null);
  };

  // Handle query errors
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setResults([]);
  };

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      {/* Query Tool Toggle Button */}
      <button
        onClick={toggleQueryTool}
        style={{
          background: queryEnabled ? '#007cbf' : 'white',
          color: queryEnabled ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          marginBottom: '8px',
          display: 'block'
        }}
      >
        🔍 {queryEnabled ? 'Disable' : 'Enable'} Query Tool
      </button>

      {/* Instructions */}
      {queryEnabled && (
        <div style={{
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px',
          fontSize: '12px',
          maxWidth: '200px'
        }}>
          {isDrawing ? (
            <div>
              <strong>Click on map</strong> to create a small query area.
              <br />
              <small>• Zoom level 14+ required</small>
              <br />
              <small>• Max 1000 acres</small>
            </div>
          ) : (
            <div>Query tool enabled. Click to start drawing.</div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px',
          fontSize: '12px',
          color: '#d32f2f',
          maxWidth: '200px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          maxWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <strong>Query Results:</strong>
          {results.map((result, index) => (
            <div key={index} style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <div><strong>{result.layerName}</strong></div>
              <div>Features: {result.featureCount}</div>
              {result.truncated && <div style={{ color: '#ff9800' }}>⚠️ Results truncated</div>}
              
              {/* Show summary data */}
              {result.summary && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
                  {result.summary.totalAcres && (
                    <div>Total Acres: {Math.round(result.summary.totalAcres)}</div>
                  )}
                  {result.summary.uniqueSoilTypes && (
                    <div>Soil Types: {result.summary.uniqueSoilTypes}</div>
                  )}
                  {result.summary.uniqueSections && (
                    <div>PLSS Sections: {result.summary.uniqueSections}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AOI Query Component - does the actual work */}
      <AOIQuery
        map={map}
        aoi={aoi}
        datasets={datasets}
        enabled={queryEnabled}
        maxFeatures={500}
        maxAcres={1000}
        minZoom={14}
        onResults={handleResults}
        onError={handleError}
      />
    </div>
  );
}
