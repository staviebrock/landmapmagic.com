import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_WORKER_ENDPOINT } from '../core/utils.js';

// CDL Crop lookup for display
const CDL_CROPS: Record<number, { name: string; color: string }> = {
  1: { name: 'Corn', color: '#FFD300' },
  2: { name: 'Cotton', color: '#FF2626' },
  3: { name: 'Rice', color: '#00A8E5' },
  4: { name: 'Sorghum', color: '#FF9E0A' },
  5: { name: 'Soybeans', color: '#267000' },
  6: { name: 'Sunflower', color: '#FFFF00' },
  21: { name: 'Barley', color: '#E2007C' },
  22: { name: 'Durum Wheat', color: '#896054' },
  23: { name: 'Spring Wheat', color: '#D8B56B' },
  24: { name: 'Winter Wheat', color: '#A57000' },
  26: { name: 'Dbl Crop WinWht/Soybeans', color: '#707000' },
  28: { name: 'Oats', color: '#A5F28C' },
  36: { name: 'Alfalfa', color: '#FFA5E2' },
  37: { name: 'Other Hay/Non Alfalfa', color: '#A5F28C' },
  41: { name: 'Sugarbeets', color: '#A800E2' },
  42: { name: 'Dry Beans', color: '#A50000' },
  43: { name: 'Potatoes', color: '#702600' },
  61: { name: 'Fallow/Idle Cropland', color: '#BFBF77' },
  111: { name: 'Open Water', color: '#4970A3' },
  121: { name: 'Developed/Open Space', color: '#E8D1D1' },
  122: { name: 'Developed/Low Intensity', color: '#E29E8C' },
  123: { name: 'Developed/Med Intensity', color: '#FF0000' },
  124: { name: 'Developed/High Intensity', color: '#B40000' },
  141: { name: 'Deciduous Forest', color: '#68AB5F' },
  142: { name: 'Evergreen Forest', color: '#1C6330' },
  143: { name: 'Mixed Forest', color: '#B5C98E' },
  176: { name: 'Grassland/Pasture', color: '#E8FFBF' },
  190: { name: 'Woody Wetlands', color: '#B1D4E0' },
  195: { name: 'Herbaceous Wetlands', color: '#70A3BA' }
};

// Simple styles
const styles = {
  container: {
    position: 'absolute' as const,
    top: '60px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(8px)',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    fontSize: '13px',
    width: '300px',
    maxHeight: '70vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    zIndex: 1000,
  },
  header: {
    padding: '12px 14px',
    borderBottom: '1px solid #e4e4e7',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#18181b',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px',
    lineHeight: 1,
  },
  section: {
    padding: '12px 14px',
    borderBottom: '1px solid #e4e4e7',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#71717a',
    marginBottom: '8px',
  },
  layerButton: (isSelected: boolean) => ({
    padding: '5px 10px',
    background: isSelected ? '#18181b' : 'white',
    border: `1px solid ${isSelected ? '#18181b' : '#d4d4d8'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    color: isSelected ? 'white' : '#52525b',
  }),
  infoBox: {
    padding: '10px 14px',
    background: '#f4f4f5',
    borderBottom: '1px solid #e4e4e7',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#52525b',
  },
  scrollArea: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '24px 10px',
    color: '#71717a',
  },
  coordsBox: {
    padding: '8px 10px',
    background: '#f4f4f5',
    borderRadius: '4px',
    marginBottom: '12px',
    fontFamily: 'Monaco, Menlo, monospace',
    fontSize: '11px',
    color: '#52525b',
  },
  resultCard: {
    background: '#fafafa',
    border: '1px solid #e4e4e7',
    borderRadius: '6px',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #e4e4e7',
    background: '#f4f4f5',
  },
  resultBody: {
    padding: '10px 12px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e4e4e7',
    borderTop: '2px solid #18181b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 8px',
  },
  errorBox: {
    padding: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    color: '#dc2626',
    fontSize: '12px',
  },
};

export interface PointLookupResult {
  layer: string;
  found: boolean;
  feature?: {
    id: string | number;
    name: string;
    properties?: Record<string, any>;
  };
  zoom?: {
    optimal: number;
    min: number;
    max: number;
  };
  metadata?: {
    name: string;
    description: string;
  };
}

export interface PointLookupResponse {
  query: {
    lat: number;
    lng: number;
    layers_requested: string[];
  };
  results: PointLookupResult[];
  query_info: {
    timestamp: string;
    account_id: string;
    processing_time_ms: number;
  };
}

export interface PointLookupProps {
  map: any;
  apiKey: string;
  baseApiUrl?: string;
  isActive: boolean;
  onToggle: () => void;
  availableLayers?: string[];
  defaultLayers?: string[];
  cdlYears?: string[];
  onResults?: (results: PointLookupResponse | null) => void;
}

export function PointLookup({
  map,
  apiKey,
  baseApiUrl,
  isActive,
  onToggle,
  availableLayers = ['states', 'counties', 'townships', 'sections', 'clu', 'cdl'],
  defaultLayers = ['states', 'counties', 'townships'],
  cdlYears = ['2024', '2023', '2022', '2021', '2020'],
  onResults
}: PointLookupProps) {
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set(defaultLayers));
  const [selectedCdlYears, setSelectedCdlYears] = useState<Set<string>>(new Set(['2024']));
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PointLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [markerRef, setMarkerRef] = useState<any>(null);

  const baseUrl = baseApiUrl || DEFAULT_WORKER_ENDPOINT;

  const toggleLayer = (layer: string) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const toggleCdlYear = (year: string) => {
    setSelectedCdlYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const buildLayersArray = useCallback(() => {
    const layers: string[] = [];
    selectedLayers.forEach(layer => {
      if (layer === 'cdl') {
        const years = Array.from(selectedCdlYears);
        if (years.length > 0) {
          layers.push(`cdl:${years.join(',')}`);
        }
      } else {
        layers.push(layer);
      }
    });
    return layers;
  }, [selectedLayers, selectedCdlYears]);

  const performLookup = useCallback(async (lat: number, lng: number) => {
    const layers = buildLayersArray();
    if (layers.length === 0) {
      setError('Please select at least one layer');
      return;
    }

    setIsLoading(true);
    setError(null);
    setClickedPoint({ lat, lng });

    try {
      const response = await fetch(`${baseUrl}/v1/data/point?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          layers,
          options: { includeGeometry: false, includeMetadata: true }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PointLookupResponse = await response.json();
      setResults(data);
      onResults?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lookup failed';
      setError(message);
      setResults(null);
      onResults?.(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, baseUrl, buildLayersArray, onResults]);

  const addMarker = useCallback((lat: number, lng: number) => {
    if (!map) return;
    if (markerRef) {
      if (map.getLayer('point-lookup-marker')) map.removeLayer('point-lookup-marker');
      if (map.getSource('point-lookup-marker')) map.removeSource('point-lookup-marker');
    }
    try {
      map.addSource('point-lookup-marker', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }
      });
      map.addLayer({
        id: 'point-lookup-marker',
        type: 'circle',
        source: 'point-lookup-marker',
        paint: { 'circle-radius': 8, 'circle-color': '#18181b', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 }
      });
      setMarkerRef('point-lookup-marker');
    } catch (err) {
      console.warn('Failed to add point marker:', err);
    }
  }, [map, markerRef]);

  const removeMarker = useCallback(() => {
    if (!map || !markerRef) return;
    try {
      if (map.getLayer('point-lookup-marker')) map.removeLayer('point-lookup-marker');
      if (map.getSource('point-lookup-marker')) map.removeSource('point-lookup-marker');
    } catch (err) {
      console.warn('Failed to remove point marker:', err);
    }
    setMarkerRef(null);
  }, [map, markerRef]);

  useEffect(() => {
    if (!map || !isActive) return;
    const handleClick = (e: any) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      addMarker(lat, lng);
      performLookup(lat, lng);
    };
    map.on('click', handleClick);
    map.getCanvas().style.cursor = 'crosshair';
    return () => {
      map.off('click', handleClick);
      map.getCanvas().style.cursor = '';
    };
  }, [map, isActive, addMarker, performLookup]);

  useEffect(() => {
    if (!isActive) {
      removeMarker();
      setResults(null);
      setClickedPoint(null);
      setError(null);
    }
  }, [isActive, removeMarker]);

  const flyToResult = (result: PointLookupResult) => {
    if (!map || !clickedPoint || !result.zoom) return;
    map.flyTo({ center: [clickedPoint.lng, clickedPoint.lat], zoom: result.zoom.optimal, duration: 1000 });
  };

  if (!isActive) return null;

  const showCdlYears = selectedLayers.has('cdl');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h4 style={styles.title}>Point Lookup</h4>
        <button onClick={onToggle} style={styles.closeButton}>×</button>
      </div>

      {/* Layer Selection */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Layers</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {availableLayers.map(layer => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer)}
              style={styles.layerButton(selectedLayers.has(layer))}
            >
              {layer}
            </button>
          ))}
        </div>

        {showCdlYears && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ ...styles.sectionLabel, marginBottom: '6px' }}>CDL Years</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cdlYears.map(year => (
                <button
                  key={year}
                  onClick={() => toggleCdlYear(year)}
                  style={{
                    ...styles.layerButton(selectedCdlYears.has(year)),
                    padding: '3px 8px',
                    fontSize: '10px',
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={styles.infoBox}>
        <span>👆</span>
        <span>Click on the map to query</span>
      </div>

      {/* Results Area */}
      <div style={styles.scrollArea}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#71717a' }}>
            <div style={styles.spinner} />
            Querying...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {!isLoading && !error && !results && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
            <div>No location selected</div>
          </div>
        )}

        {results && (
          <>
            {clickedPoint && (
              <div style={styles.coordsBox}>
                <strong style={{ color: '#18181b' }}>
                  {clickedPoint.lat.toFixed(6)}, {clickedPoint.lng.toFixed(6)}
                </strong>
                <span style={{ float: 'right', color: '#a1a1aa' }}>
                  {results.query_info.processing_time_ms}ms
                </span>
              </div>
            )}

            {results.results.map((result, idx) => {
              const isCdl = result.layer.startsWith('cdl:');
              const cropCode = isCdl && result.feature?.properties?.crop_code;
              const cropInfo = cropCode ? CDL_CROPS[cropCode] : null;

              return (
                <div
                  key={`${result.layer}-${idx}`}
                  onClick={() => result.found && flyToResult(result)}
                  style={{
                    ...styles.resultCard,
                    cursor: result.found ? 'pointer' : 'default',
                    opacity: result.found ? 1 : 0.6,
                  }}
                >
                  <div style={styles.resultHeader}>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#52525b' }}>
                      {isCdl ? `CDL ${result.layer.split(':')[1]}` : result.layer}
                    </span>
                    {result.zoom && (
                      <span style={{ fontSize: '10px', color: '#a1a1aa' }}>z{result.zoom.optimal}</span>
                    )}
                  </div>
                  <div style={styles.resultBody}>
                    {result.found && result.feature ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#18181b' }}>
                          {result.feature.name}
                        </div>
                        {!isCdl && (
                          <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                            ID: {result.feature.id}
                          </div>
                        )}
                        {isCdl && cropInfo && (
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px',
                              background: cropInfo.color,
                              border: '1px solid #d4d4d8',
                              display: 'inline-block',
                            }} />
                            <span style={{ fontSize: '11px', color: '#71717a' }}>Code: {cropCode}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#a1a1aa', fontStyle: 'italic', fontSize: '12px' }}>
                        No data found
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
